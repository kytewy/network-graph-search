#!/usr/bin/env python3
"""
D1: how much of each document the app can actually see. Reads the same data
the uploader uses; changes nothing and calls no service.

  python scripts/check_document_lengths.py

For each document it compares the full body with three cut-offs:
  stored  - the uploader keeps 15,000 characters of content (8,000 if the record is too big)
  search  - embeddings are made from chunk_text, cut to 10,000 characters, and the
            embedding model reads about 2,048 tokens (roughly 8,000 characters)
  chat    - the chat sends the whole text if it fits in 800, else a real summary, else the start, cut to 800
"""
import os
import sys
import types

# The uploader imports Pinecone and dotenv; this check needs neither
sys.modules.setdefault('pinecone', types.SimpleNamespace(Pinecone=object))
sys.modules.setdefault('dotenv', types.SimpleNamespace(load_dotenv=lambda *a, **k: None))

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import upload_all_data as up  # noqa: E402

up.validate_record = lambda record: record  # measure the originals, before any cutting

STORED, SEARCH, CHAT = 15_000, 8_000, 800


def sources():
    return {
        'EU articles': up.load_eu_articles(HERE),
        'EU recitals': up.load_eu_recitals(HERE),
        'Canada': up.load_canadian_data(),
        'IAPP': up.load_iapp_data(),
    }


def row(record):
    body = len(record.get('content') or '')
    summary = (record.get('summary') or '').strip()
    real_summary = summary if summary and summary != (record.get('label') or '').strip() else ''
    # Mirrors analysisText(): whole text if it fits, else a real summary, else the start of the text
    chat = body if body <= CHAT else min(len(real_summary) or body, CHAT)
    return {
        'id': record['_id'],
        'title': (record.get('label') or record['_id'])[:60],
        'body': body,
        'stored_cut': body > STORED,
        'search_blind': len(record.get('chunk_text') or '') > SEARCH,
        'chat_share': chat / body if body else 1.0,
    }


def main():
    rows_by_source = {name: [row(r) for r in records] for name, records in sources().items()}
    rows = [r for rs in rows_by_source.values() for r in rs]
    print(f"\n{'Source':<12} {'Docs':>5} {'Median body':>12} {'Longest':>9} {'Stored cut':>11} {'Search blind':>13} {'Chat sees':>10}")
    for name, rs in rows_by_source.items():
        if not rs:
            continue
        bodies = sorted(r['body'] for r in rs)
        share = sum(r['chat_share'] for r in rs) / len(rs)
        print(f"{name:<12} {len(rs):>5} {bodies[len(bodies) // 2]:>12,} {bodies[-1]:>9,} "
              f"{sum(r['stored_cut'] for r in rs):>11} {sum(r['search_blind'] for r in rs):>13} {share:>9.0%}")
    print(f"\nAll: {len(rows)} documents. 'Chat sees' = average share of the body the chat sends.")
    print("\nLongest documents:")
    for r in sorted(rows, key=lambda r: -r['body'])[:10]:
        flags = ', '.join(f for f, on in (('stored cut', r['stored_cut']), ('search blind past ~8,000', r['search_blind'])) if on)
        print(f"  {r['body']:>7,}  chat sees {r['chat_share']:>4.0%}  {r['title']}{'  [' + flags + ']' if flags else ''}")


if __name__ == '__main__':
    main()
