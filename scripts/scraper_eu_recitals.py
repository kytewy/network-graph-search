#!/usr/bin/env python3
"""
Test EU AI Act Recitals Scraper - First 5 Recitals
Simple test version to scrape and display the first 5 recitals.
"""

import requests
from bs4 import BeautifulSoup
import json
import time

def extract_recital_content(html_content, recital_id):
    """Extract recital title and content from HTML based on actual structure."""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Method 1: Look for the main content div structure
    # Based on the screenshot, content is in divs with class et_pb_post_content
    content_divs = soup.find_all('div', class_=lambda x: x and 'et_pb_post_content' in x)
    
    for div in content_divs:
        # Look for paragraphs within these divs
        paragraphs = div.find_all('p')
        for p in paragraphs:
            text = p.get_text(strip=True)
            if len(text) > 100:  # Substantial content
                # Skip obvious non-recital content
                if not any(skip in text.lower() for skip in [
                    'this website is maintained', 'future of life', 'transparency register',
                    'feedback', 'note:', 'official text', 'interinstitutional file'
                ]):
                    return f"Recital {recital_id}", text
    
    # Method 2: Look for any paragraph with regulation content
    all_paragraphs = soup.find_all('p')
    for p in all_paragraphs:
        text = p.get_text(strip=True)
        if len(text) > 100:
            text_lower = text.lower()
            # Skip footer/header content
            if not any(skip in text_lower for skip in [
                'this website is maintained', 'future of life', 'transparency register',
                'feedback', 'note:', 'official text'
            ]):
                # Check if this looks like recital content
                if any(indicator in text_lower for indicator in [
                    'regulation', 'charter', 'union', 'artificial intelligence', 'ai'
                ]):
                    return f"Recital {recital_id}", text
    
    # Method 3: Look in the main content area more broadly
    # Sometimes the content might be in different wrapper divs
    main_content = soup.find('div', class_=lambda x: x and ('content' in x or 'post' in x))
    if main_content:
        text = main_content.get_text(strip=True)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        for line in lines:
            if (len(line) > 100 and 
                not any(skip in line.lower() for skip in [
                    'this website is maintained', 'future of life', 'transparency register'
                ]) and
                any(indicator in line.lower() for indicator in [
                    'regulation', 'charter', 'union', 'artificial intelligence'
                ])):
                return f"Recital {recital_number}", line
    
    # Method 4: Fallback - look at all text but filter more carefully
    all_text = soup.get_text()
    
    # Split by common separators and look for the recital content
    sections = all_text.split('Recital')
    if len(sections) > 1:
        # The content after "Recital X" heading should contain our text
        for section in sections[1:]:  # Skip first section which is before any recital
            lines = [line.strip() for line in section.split('\n') if line.strip()]
            for line in lines:
                if (len(line) > 100 and 
                    not line.isdigit() and  # Skip recital numbers
                    not any(skip in line.lower() for skip in [
                        'this website is maintained', 'future of life', 'previous', 'next'
                    ]) and
                    any(indicator in line.lower() for indicator in [
                        'regulation', 'charter', 'union', 'artificial intelligence', 'trustworthy'
                    ])):
                    return f"Recital {recital_number}", line
    
    return None, None

def test_scraper():
    """Test the scraper on first 5 recitals."""
    base_url = "https://artificialintelligenceact.eu/recital/"
    results = []
    
    # Set up session with headers
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    print("Testing EU AI Act Scraper on first 5 recitals...")
    print("=" * 50)
    
    for i in range(1, 181):  # Test recitals 1-5
        url = f"{base_url}{i}/"
        
        try:
            print(f"Fetching Recital R{i}...")
            response = session.get(url, timeout=10)
            response.raise_for_status()
            
            title, content = extract_recital_content(response.text, f"R{i}")
            
            if title and content:
                recital_data = {
                    "id": f"R{i}",
                    "title": title,
                    "content": content,
                    "continent": "Europe",
                    "sourceType": "NGO",
                    "url": url,
                    "content_length": len(content)
                }
                results.append(recital_data)
                
                print(f"✅ Successfully scraped {title}")
                print(f"   Content length: {len(content)} characters")
                print(f"   Preview: {content[:100]}...")
                print()
                
            else:
                print(f"❌ Failed to extract content from Recital R{i}")
                
        except Exception as e:
            print(f"❌ Error fetching Recital R{i}: {e}")
        
        # Small delay between requests
        time.sleep(0.5)
    
    # Display results summary
    print("\n" + "=" * 50)
    print("RESULTS SUMMARY")
    print("=" * 50)
    print(f"Successfully scraped: {len(results)}/5 recitals")
    
    if results:
        print("\nFull content of scraped recitals:")
        print("-" * 30)
        
        for recital in results:
            print(f"\n{recital['title']}:")
            print(f"URL: {recital['url']}")
            print(f"Content: {recital['content']}")
            print("-" * 50)
        
        # Save to JSON file
        output_data = {
            "test_info": {
                "total_scraped": len(results),
                "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "test_range": "1-5"
            },
            "recitals": results
        }
        
        with open("test_recitals_1_to_180.json", "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Results saved to: test_recitals_1_to_180.json")
        
    return results

if __name__ == "__main__":
    results = test_scraper()
    
    if results:
        print(f"\n🎉 Test completed successfully! Scraped {len(results)} recitals.")
    else:
        print("\n😞 Test failed - no recitals were scraped successfully.")