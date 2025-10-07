import requests
from bs4 import BeautifulSoup
import json
import time
import re

def scrape_article_date(article_number):
    """
    Scrape the date of entry into force from a specific EU AI Act article page.
    
    Args:
        article_number (int): The article number to scrape
        
    Returns:
        dict: Dictionary containing article number and date of entry into force
    """
    base_url = "https://artificialintelligenceact.eu/article/"
    url = f"{base_url}{article_number}/"
    
    try:
        # Add headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for the date of entry into force
        entry_into_force_date = None
        
        # Remove script, style, navigation elements that might contain unwanted text
        for element in soup(["script", "style", "nav", "header", "footer"]):
            element.decompose()
        
        # Look for the main content area - usually in article, main, or content divs
        main_content_areas = soup.find_all(['article', 'main', 'div'], 
                                         class_=re.compile(r'content|main|post|article', re.IGNORECASE))
        
        if not main_content_areas:
            # Fallback to the entire body if no specific content area found
            main_content_areas = [soup.body] if soup.body else [soup]
        
        # Extract Date of entry into force
        # Look for patterns like "Date of entry into force: 2 February 2025"
        for content_area in main_content_areas:
            if content_area:
                content_text = content_area.get_text(separator=' ', strip=True)
                
                # Look for date patterns
                date_patterns = [
                    r'Date of entry into force:\s*([^A-Z]*?)(?:[A-Z]|$)',
                    r'Date of entry into force:\s*([^\n\r]*?)(?:\n|\r|$)',
                    r'Date of entry into force:\s*(.*?)(?:According to:|Inherited from:|$)'
                ]
                
                for pattern in date_patterns:
                    match = re.search(pattern, content_text, re.IGNORECASE)
                    if match:
                        potential_date = match.group(1).strip()
                        
                        # Clean up the date - remove extra text after the actual date
                        potential_date = re.sub(r'\s+', ' ', potential_date)  # Normalize whitespace
                        
                        # Validate it looks like a date (contains month/year patterns)
                        if (len(potential_date) < 100 and  # Not too long
                            any(month in potential_date for month in 
                                ['January', 'February', 'March', 'April', 'May', 'June',
                                 'July', 'August', 'September', 'October', 'November', 'December']) and
                            re.search(r'20\d{2}', potential_date)):  # Contains a year like 2025
                            entry_into_force_date = potential_date
                            break
                
                if entry_into_force_date:
                    break
        
        return {
            'article_number': article_number,
            'url': url,
            'date_of_entry_into_force': entry_into_force_date,
            'status': 'success' if entry_into_force_date else 'no_date_found'
        }
        
    except requests.RequestException as e:
        return {
            'article_number': article_number,
            'url': url,
            'date_of_entry_into_force': None,
            'status': f'error: {str(e)}'
        }
    except Exception as e:
        return {
            'article_number': article_number,
            'url': url,
            'date_of_entry_into_force': None,
            'status': f'parsing_error: {str(e)}'
        }

def scrape_multiple_articles(article_numbers, delay=2):
    """
    Scrape dates from multiple articles.
    
    Args:
        article_numbers (list): List of article numbers to scrape
        delay (float): Delay between requests in seconds
        
    Returns:
        list: List of dictionaries containing article data
    """
    results = []
    
    for i, article_num in enumerate(article_numbers):
        print(f"Scraping article {article_num} ({i+1}/{len(article_numbers)})...")
        
        result = scrape_article_date(article_num)
        results.append(result)
        
        # Print status and date
        if result['status'] == 'success':
            print(f"✓ Successfully scraped article {article_num}")
            if result['date_of_entry_into_force']:
                print(f"  Date of entry into force: {result['date_of_entry_into_force']}")
        else:
            print(f"✗ Failed to scrape article {article_num}: {result['status']}")
        
        # Add delay to be respectful to the server
        if i < len(article_numbers) - 1:
            time.sleep(delay)
    
    return results

def save_to_json(data, filename):
    """Save the scraped data to a JSON file."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Data saved to {filename}")

# Test with all 113 articles
if __name__ == "__main__":
    print("EU AI Act Article Date Scraper - ALL ARTICLES")
    print("=" * 60)
    
    # Test with all 113 articles
    all_articles = list(range(1, 114))
    
    print(f"Scraping dates from all {len(all_articles)} articles...")
    print("This will take approximately 6-8 minutes with 2-second delays between requests.")
    print("=" * 60)
    
    results = scrape_multiple_articles(all_articles, delay=2)
    
    # Save results
    save_to_json(results, 'eu_ai_act_dates_all_articles.json')
    
    # Analyze the results
    print("\n" + "=" * 60)
    print("ANALYSIS OF ALL ARTICLES:")
    
    successful = len([r for r in results if r['status'] == 'success' and r['date_of_entry_into_force']])
    failed = len([r for r in results if r['status'] != 'success' or not r['date_of_entry_into_force']])
    
    print(f"Successfully extracted dates: {successful}/{len(results)} articles")
    print(f"Failed extractions: {failed}/{len(results)} articles")
    
    # Group by date to see the different implementation dates
    date_groups = {}
    for result in results:
        if result['date_of_entry_into_force']:
            date = result['date_of_entry_into_force']
            if date not in date_groups:
                date_groups[date] = []
            date_groups[date].append(result['article_number'])
    
    print(f"\n" + "=" * 60)
    print("DATES FOUND ACROSS ALL ARTICLES:")
    for date, articles in sorted(date_groups.items()):
        print(f"\n📅 {date}:")
        print(f"   Articles: {sorted(articles)} ({len(articles)} total)")
    
    # Show failed extractions
    failed_articles = [r['article_number'] for r in results if r['status'] != 'success' or not r['date_of_entry_into_force']]
    if failed_articles:
        print(f"\n" + "=" * 60)
        print("FAILED EXTRACTIONS:")
        print(f"Articles with no date found: {failed_articles}")
    
    # Show some successful examples
    print(f"\n" + "=" * 60)
    print("SAMPLE SUCCESSFUL EXTRACTIONS:")
    sample_count = 0
    for result in results:
        if result['date_of_entry_into_force'] and sample_count < 10:
            print(f"  Article {result['article_number']}: {result['date_of_entry_into_force']}")
            sample_count += 1
    
    print(f"\n" + "=" * 60)
    print("SUMMARY STATISTICS:")
    print(f"Total articles processed: {len(results)}")
    print(f"Successful extractions: {successful} ({successful/len(results)*100:.1f}%)")
    print(f"Different implementation dates found: {len(date_groups)}")
    print(f"Data saved to: eu_ai_act_dates_all_articles.json")
    
    # Quick validation on known articles
    print(f"\n" + "=" * 60)
    print("VALIDATION CHECK ON KNOWN ARTICLES:")
    known_dates = {
        2: "2 February 2025",
        5: "2 February 2025", 
        11: "2 August 2026"
    }
    
    for article_num, expected_date in known_dates.items():
        found_result = next((r for r in results if r['article_number'] == article_num), None)
        if found_result and found_result['date_of_entry_into_force']:
            found_date = found_result['date_of_entry_into_force']
            status = "✓ CORRECT" if expected_date in found_date else "✗ DIFFERENT"
            print(f"  Article {article_num}: Expected '{expected_date}' | Found '{found_date}' | {status}")
        else:
            print(f"  Article {article_num}: Expected '{expected_date}' | Found 'None' | ✗ FAILED")
