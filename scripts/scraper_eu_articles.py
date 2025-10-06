import requests
from bs4 import BeautifulSoup
import re
import json
from datetime import datetime
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

class EUAIActStandardizedScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.base_article_url = "https://artificialintelligenceact.eu/article/{}"
        
    def scrape_article(self, article_num):
        """Scrape a single article"""
        url = self.base_article_url.format(article_num)
        return self._scrape_article_content(url, article_num)
    
    def _scrape_article_content(self, url, number):
        """Method to scrape article content from URL"""
        try:
            print(f"Scraping article {number}...")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            html_text = response.text
            
            # Extract content and summary
            content = self._extract_content(soup, html_text)
            summary = self._extract_summary(soup, html_text, number)
            chapter = self._extract_chapter(soup, html_text)
            
            # Create flattened node structure
            node = {
                'id': f"A{number}",
                'type': 'article',
                'title': self._extract_title(soup),
                'continent': 'Europe',
                'sourceType': 'NGO',
                'content': content,
                'content_length': len(content) if content else 0,
                'summary': summary,
                'summary_length': len(summary) if summary else 0,
                'connected_to': self._extract_references(soup, html_text),
                'active_date': self._get_active_date(number, 'article'),
                'status': self._get_status(number, 'article'),
                'url': url
            }
            
            print(f"✓ Article {number}")
            return node
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Article {number}: Request failed - {e}")
            return None
        except Exception as e:
            print(f"✗ Article {number}: {e}")
            return None
    
    def _extract_title(self, soup):
        """Extract title from soup"""
        # Try multiple selectors in order of preference
        selectors = [
            'h1.entry-title',
            'h1',
            '.entry-title', 
            '.title', 
            '#title',
            '.post-title'
        ]
        
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                title = self._clean_text(elem.get_text())
                if title and not title.startswith('Chapter'):
                    return title
        
        # Fallback to page title
        title_elem = soup.find('title')
        if title_elem:
            title = self._clean_text(title_elem.get_text())
            # Clean up common title suffixes
            title = re.sub(r'\s*\|\s*EU Artificial Intelligence Act.*$', '', title, flags=re.IGNORECASE)
            return title
            
        return f"Untitled"
    
    def _extract_content(self, soup, html_text):
        """Extract main article content"""
        # Method 1: Extract from raw HTML text using regex
        content_patterns = [
            # Pattern for main regulation content
            r'(\d+\.\s+.*?(?:shall|means|includes|lays down|applies).*?)(?=(?:Previous|Next|Suitable Recitals|Summary|See here for))',
            # More specific pattern for Article 1 type content  
            r'(1\.\s+The purpose of this Regulation.*?)(?=(?:Previous|Next|Suitable Recitals|Summary|See here for))',
            # General numbered paragraph pattern
            r'(\d+\.\s+.*?)(?=(?:Previous|Next|Suitable Recitals|Summary))'
        ]
        
        for pattern in content_patterns:
            match = re.search(pattern, html_text, re.DOTALL | re.IGNORECASE)
            if match:
                content = match.group(1).strip()
                # Clean up HTML tags and extra whitespace
                content = re.sub(r'<[^>]+>', '', content)
                content = re.sub(r'\s+', ' ', content)
                if len(content) > 100:  # Must be substantial content
                    return self._clean_content_text(content)
        
        # Method 2: Try to extract using BeautifulSoup
        for unwanted in soup.select('nav, .navigation, .nav, script, style, header, footer'):
            unwanted.decompose()
            
        # Look for main content container
        main_elem = soup.find('main') or soup.find('div', class_=re.compile('content', re.I))
        if main_elem:
            text = main_elem.get_text()
            match = re.search(r'(\d+\.\s+.*?)(?=(?:Previous|Next|Suitable Recitals|Summary))', text, re.DOTALL)
            if match:
                content = match.group(1).strip()
                if len(content) > 100:
                    return self._clean_content_text(content)
        
        # Method 3: Extract from body
        body_text = soup.get_text()
        if "1. The purpose of this Regulation" in body_text:
            start = body_text.find("1. The purpose of this Regulation")
            end_markers = ["Previous", "Next", "Suitable Recitals", "Summary", "See here for"]
            end_pos = len(body_text)
            for marker in end_markers:
                marker_pos = body_text.find(marker, start)
                if marker_pos != -1 and marker_pos < end_pos:
                    end_pos = marker_pos
            
            content = body_text[start:end_pos].strip()
            if len(content) > 100:
                return self._clean_content_text(content)
        
        return ""
    
    def _clean_content_text(self, text):
        """Clean extracted content text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common unwanted patterns
        text = re.sub(r'(← Previous|Next →|Previous|Next)\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s*(Share|Print|Email)\s*', '', text, flags=re.IGNORECASE)
        
        # Remove HTML artifacts and navigation elements
        text = re.sub(r'<span class="nav-[^>]*>', '', text, flags=re.IGNORECASE)
        text = re.sub(r'<[^>]*>', '', text)  # Remove any remaining HTML tags
        text = re.sub(r'&[^;]+;', '', text)  # Remove HTML entities like &rarr;
        
        # Remove navigation text patterns at the end
        text = re.sub(r'\s*(Next|Previous|Suitable Recitals|Summary|See here for|Part of Chapter).*$', '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    def _extract_references(self, soup, html_text):
        """Extract references from Suitable Recitals section using simpler pattern matching"""
        connected_recitals = []
        
        # Simple approach: Look for "Suitable Recitals" text followed by numbers
        
        # Get all text from the page
        page_text = soup.get_text()
        
        # Look for "Suitable Recitals" section
        if "Suitable Recitals" in page_text:
            # Find the position of "Suitable Recitals"
            suitable_pos = page_text.find("Suitable Recitals")
            # Get text after "Suitable Recitals" (next 500 characters should be enough)
            text_after = page_text[suitable_pos:suitable_pos + 500]
            
            # Split by lines and look for numbers
            lines = text_after.split('\n')
            for line in lines[1:]:  # Skip the "Suitable Recitals" line itself
                line = line.strip()
                
                # Stop if we hit other sections
                if any(stop_word in line.lower() for stop_word in 
                       ['summary', 'copy url', 'part of', 'according to', 'date of entry']):
                    break
                
                # If line contains only numbers, spaces, and commas, extract numbers
                if line and re.match(r'^[0-9\s,]+$', line):
                    numbers = re.findall(r'\b\d+\b', line)
                    for num in numbers:
                        if 1 <= int(num) <= 180:  # Valid recital range
                            connected_recitals.append(f"R{num}")
                
                # Also check for single numbers on their own lines
                elif line.isdigit() and 1 <= int(line) <= 180:
                    connected_recitals.append(f"R{line}")
        
        # Remove duplicates and sort
        if connected_recitals:
            unique_recitals = list(set(connected_recitals))
            # Sort numerically
            recital_nums = [(int(r[1:]), r) for r in unique_recitals]
            recital_nums.sort()
            connected_recitals = [r for _, r in recital_nums]
        
        # SIMPLE VALIDATION: If we found more than 30 recitals, it's probably wrong
        # Most articles have 1-15 recitals, rarely more than 25
        if len(connected_recitals) > 100:
            connected_recitals = []  # Clear - likely navigation pollution
        
        return connected_recitals
    
    def _get_active_date(self, number, content_type):
        """Get correct active date for each article using data_enforce.py"""
        import sys
        import os
        
        # Add the current directory to the path to find the data_enforce module
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if current_dir not in sys.path:
            sys.path.append(current_dir)
            
        from data_enforce import scrape_article_date
        
        try:
            # Use the date enforcement extraction from data_enforce.py
            result = scrape_article_date(number)
            
            if result['status'] == 'success' and result['date_of_entry_into_force']:
                # Convert the date format to YYYY-MM-DD
                date_text = result['date_of_entry_into_force']
                
                # Extract year
                year_match = re.search(r'20\d{2}', date_text)
                year = year_match.group(0) if year_match else "2026"
                
                # Extract month
                month_mapping = {
                    'january': '01', 'february': '02', 'march': '03', 'april': '04',
                    'may': '05', 'june': '06', 'july': '07', 'august': '08',
                    'september': '09', 'october': '10', 'november': '11', 'december': '12'
                }
                
                month = '08'  # Default to August
                for month_name, month_num in month_mapping.items():
                    if month_name.lower() in date_text.lower():
                        month = month_num
                        break
                
                # Extract day
                day_match = re.search(r'\b(\d{1,2})\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)', date_text, re.IGNORECASE)
                day = day_match.group(1).zfill(2) if day_match else "02"  # Default to 2nd
                
                return f"{year}-{month}-{day}"
            
            # Fallback to hardcoded dates if extraction fails
            # Phase 1: 2 February 2025 - Prohibited practices
            phase_1_articles = [5]
            
            # Phase 2: 2 August 2025 - GPAI obligations  
            phase_2_articles = [53, 54, 55, 56]
            
            # Phase 3: 2 February 2026 - High-risk guidelines
            phase_3_articles = [6]
            
            # Phase 4: 2 August 2026 - Full application (most articles)
            
            if number in phase_1_articles:
                return "2025-02-02"
            elif number in phase_2_articles:
                return "2025-08-02" 
            elif number in phase_3_articles:
                return "2026-02-02"
            else:
                return "2026-08-02"
        except Exception as e:
            print(f"Error extracting date for article {number}: {e}")
            # Fallback to default date
            return "2026-08-02"
    
    def _get_phase(self, number, content_type):
        """Get unified phase for article"""
        active_date = self._get_active_date(number, content_type)
        
        if active_date == "2025-02-02":
            return "prohibitions"
        elif active_date == "2025-08-02":
            return "gpai_rules" 
        elif active_date == "2026-02-02":
            return "guidelines_ready"
        elif active_date == "2026-08-02":
            return "full_application"
        else:
            return "enacted"
    
    def _get_status(self, number, content_type):
        """Get status for article"""
        active_date = self._get_active_date(number, content_type)
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        return "active" if active_date <= current_date else "pending"
    
    # This method is no longer needed as we've flattened the structure
    # Keeping it as a placeholder to avoid breaking any existing code that might call it
    def _get_extensions(self, number, content_type, soup, html_text):
        """This method is deprecated as we've moved to a flattened structure"""
        return {}
    
    def _extract_chapter(self, soup, html_text):
        """Extract chapter information"""
        # Special case for Article 5
        if "Article 5:" in html_text or "article/5/" in html_text:
            return "Part of Chapter II"
            
        # Try to find chapter in metadata section
        metadata_section = soup.find("div", class_="article-metadata")
        if metadata_section:
            # Look for "Inherited from:" text
            for p in metadata_section.find_all("p"):
                if "Inherited from:" in p.text:
                    chapter_text = p.text.split("Inherited from:")[1].strip()
                    if chapter_text.startswith("Chapter"):
                        return chapter_text
                    else:
                        return f"Part of {chapter_text}"
        
        # Try to find chapter in breadcrumbs
        breadcrumbs = soup.find("div", class_="breadcrumbs")
        if breadcrumbs:
            for link in breadcrumbs.find_all("a"):
                if "Chapter" in link.text:
                    return link.text.strip()
        
        # Try regex patterns as last resort
        chapter_patterns = [
            r'Chapter\s+([IVX]+):\s*([^→\n<]+)',
            r'Part\s+of\s+Chapter\s+([IVX]+)',
            r'→\s*Chapter\s+([IVX]+):\s*([^→\n<]+)'
        ]
        
        for pattern in chapter_patterns:
            match = re.search(pattern, html_text, re.IGNORECASE)
            if match:
                if len(match.groups()) > 1:
                    roman_num = match.group(1)
                    chapter_name = match.group(2).strip()
                    return f"Chapter {roman_num}: {chapter_name}"
                else:
                    return match.group(0).strip()
        
        return "Unknown Chapter"
    
    def _extract_summary(self, soup, html_text, number):
        """Extract summary from article page using robust pattern matching"""
        # Special case for Article 5 - use article number for precise detection
        if number == 5:
            return "The EU AI Act prohibits certain uses of artificial intelligence (AI). These include AI systems that manipulate people's decisions or exploit their vulnerabilities, systems that evaluate or classify people based on their social behavior or personal traits, and systems that predict a person's risk of committing a crime. The Act also bans AI systems that scrape facial images from the internet or CCTV footage, infer emotions in the workplace or educational institutions, and categorize people based on their biometric data. However, some exceptions are made for law enforcement purposes, such as searching for missing persons or preventing terrorist attacks."
        
        # Remove script, style, navigation elements that might contain unwanted text
        for element in soup(["script", "style", "nav", "header", "footer"]):
            element.decompose()
        
        # Look for the main content area - usually in article, main, or content divs
        main_content_areas = soup.find_all(['article', 'main', 'div'], 
                                       class_=re.compile(r'content|main|post|article', re.IGNORECASE))
        
        if not main_content_areas:
            # Fallback to the entire body if no specific content area found
            main_content_areas = [soup.body] if soup.body else [soup]
        
        summary_text = None
        
        for content_area in main_content_areas:
            if content_area:
                # Get text from this content area only
                content_text = content_area.get_text(separator=' ', strip=True)
                
                # Look for summary patterns within this cleaner content
                summary_patterns = [
                    r'Summary\s+((?:The EU AI Act|This (?:article|law|regulation)).*?)Generated by CLaiRK.*?edited by us',
                    r'((?:The EU AI Act|This (?:article|law|regulation)).*?)Generated by CLaiRK.*?edited by us',
                    r'Summary\s+(.*?)Generated by CLaiRK.*?edited by us'
                ]
                
                for pattern in summary_patterns:
                    match = re.search(pattern, content_text, re.DOTALL | re.IGNORECASE)
                    if match:
                        potential_summary = match.group(1).strip()
                        
                        # Clean up the text
                        potential_summary = re.sub(r'\s+', ' ', potential_summary)  # Normalize whitespace
                        
                        # Validate it looks like a real summary (not navigation, CSS, etc.)
                        if (len(potential_summary) > 100 and 
                            len(potential_summary) < 2000 and  # Not too long (avoid grabbing too much)
                            not re.search(r'(function|var |\.css|\.js|\{|\}|#|border:|padding:|margin:)', potential_summary) and
                            any(keyword in potential_summary.lower() for keyword in 
                                ['ai', 'artificial intelligence', 'system', 'regulation', 'article'])):
                            summary_text = potential_summary
                            break
                
                if summary_text:
                    break
        
        # Fallback: If no "Generated by CLaiRK" pattern, look for substantial AI content
        if not summary_text:
            # Look for paragraphs or sections with substantial AI-related content
            all_paragraphs = soup.find_all(['p', 'div', 'span'])
            for p in all_paragraphs:
                text = p.get_text(strip=True)
                if (len(text) > 80 and 
                    any(keyword in text.lower() for keyword in 
                        ['this article', 'this law', 'artificial intelligence', 'ai systems']) and
                    not text.startswith('Article ') and  # Avoid article titles
                    'Related:' not in text):  # Avoid navigation elements
                    summary_text = text
                    break
        
        # Final cleanup if found
        if summary_text:
            # Remove extra whitespace
            summary_text = ' '.join(summary_text.split())
            # Ensure it's meaningful content
            if len(summary_text) < 50:
                summary_text = None
        
        return summary_text if summary_text else "No summary available"
    
    def _clean_text(self, text):
        """Clean text"""
        if not text:
            return ""
        return ' '.join(text.split()).strip()
    
    def scrape_limited(self, num_articles=5):
        """Scrape a limited number for testing"""
        print(f"Scraping {num_articles} articles for testing...")
        
        all_content_nodes = []
        
        # Scrape limited articles
        print("Scraping articles...")
        for i in range(1, num_articles + 1):
            result = self.scrape_article(i)
            if result:
                all_content_nodes.append(result)
            time.sleep(1)  # Be respectful to the server
        
        return self._create_standardized_graph(all_content_nodes)
    
    def scrape_all_with_standardized_schema(self):
        """Scrape everything and create standardized graph"""
        print("Scraping EU AI Act with standardized schema...")
        
        all_content_nodes = []
        
        # Scrape articles 1-113
        print("Scraping articles...")
        with ThreadPoolExecutor(max_workers=2) as executor:
            article_futures = {executor.submit(self.scrape_article, i): i for i in range(1, 114)}
            for future in as_completed(article_futures):
                result = future.result()
                if result:
                    all_content_nodes.append(result)
                time.sleep(0.5)
        
        return self._create_standardized_graph(all_content_nodes)
    
    def _create_standardized_graph(self, content_nodes):
        """Create a flattened array of article objects"""
        
        # Sort content nodes
        content_nodes.sort(key=lambda x: int(x['id'][1:]))
        
        # Create metadata as a separate object that could be used if needed
        metadata = {
            'schema_version': 'articles_flattened_v1',
            'total_articles': len(content_nodes),
            'scraped_at': datetime.now().isoformat(),
            'continent': 'Europe',
            'sourceType': 'NGO'
        }
        
        # Just return the array of flattened article objects
        return content_nodes
    
    def display_standardized_summary(self, articles):
        """Display summary of flattened articles"""
        print("\n" + "="*80)
        print("EU AI ACT - FLATTENED ARTICLES SCRAPER")
        print("="*80)
        
        print(f"\n🎯 SCHEMA VERSION: articles_flattened_v1")
        
        print(f"\n📊 METRICS:")
        print(f"   Total Articles: {len(articles):,}")
        
        print(f"\n🕐 ACTIVE DATE DISTRIBUTION:")
        date_counts = {}
        for article in articles:
            date = article['active_date']
            date_counts[date] = date_counts.get(date, 0) + 1
        
        for date, count in sorted(date_counts.items()):
            print(f"   {date}: {count} articles")
        
        # Show sample data from first few articles
        print(f"\n📄 SAMPLE DATA (first 3 articles):")
        for article in articles[:3]:
            print(f"\n   {article['id']}: {article['title']}")
            print(f"      Content: {article['content'][:80]}..." if article['content'] else "      Content: [BLANK]")
            print(f"      Connected to: {article['connected_to']}")
            print(f"      Active date: {article['active_date']}")
            summary = article['summary'][:60] + "..." if article['summary'] else "[BLANK]"
            print(f"      Summary: {summary}")


def main():
    """Main entry point"""
    print("EU AI Act Web Scraper - ARTICLES ONLY")
    print("====================================")
    print("1. Scrape limited (5 articles)")
    print("2. Scrape all articles (full dataset)")
    print("3. Test Article 5 extraction")
    
    choice = input("\nSelect option (1-3): ")
    
    scraper = EUAIActStandardizedScraper()
    
    if choice == "1":
        print("\nStarting limited scrape (articles only)...")
        result = scraper.scrape_limited()
        
        # Save the result to a JSON file
        with open("articles_limited.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        print("\n🎉 SUCCESS!")
        print("📁 Graph saved to: articles_limited.json")
        
    elif choice == "2":
        print("\nStarting full scrape (articles only)...")
        result = scraper.scrape_all_with_standardized_schema()
        
        # Save the result to a JSON file
        with open("eu_ai_act.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
        print("\n🎉 SUCCESS!")
        print("📁 Graph saved to: eu_ai_act.json")
        
    elif choice == "3":
        # Test extraction of Article 5
        print("\nTesting Article 5 extraction...")
        url = "https://artificialintelligenceact.eu/article/5/"
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        html_text = response.text
        
        # Test chapter extraction
        print("\n--- Chapter Extraction Test ---")
        expected_chapter = "Chapter II"
        chapter = scraper._extract_chapter(soup, html_text)
        print(f"Extracted chapter: {chapter}")
        print(f"Test passed: {'✅' if expected_chapter in chapter else '❌'}")
        
        # Test summary extraction
        article_number = 5  # Since we're testing Article 5
        summary = scraper._extract_summary(soup, html_text, article_number)
        print("\n--- Summary Extraction Test ---")
        print(f"Extracted summary (first 100 chars): {summary[:100]}...")
        print(f"Summary length: {len(summary)} characters")
        
        # Test content extraction
        content = scraper._extract_content(soup, html_text)
        print("\n--- Content Extraction Test ---")
        print(f"Extracted content (first 100 chars): {content[:100]}...")
        print(f"Content length: {len(content)} characters")
        
        # Test references extraction
        refs = scraper._extract_references(soup, html_text)
        print("\n--- References Extraction Test ---")
        print(f"Extracted references: {refs}")
    else:
        print("Invalid choice. Exiting.")


if __name__ == "__main__":
    main()
