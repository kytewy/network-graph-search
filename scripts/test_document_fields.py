"""
Checks the fields the upload script writes. Runs without Pinecone:
    python3 scripts/test_document_fields.py
"""
import os
import sys
import types
import unittest

# The loaders don't need Pinecone or dotenv; stub them so this runs anywhere
sys.modules.setdefault('pinecone', types.SimpleNamespace(Pinecone=object))
sys.modules.setdefault('dotenv', types.SimpleNamespace(load_dotenv=lambda: None))
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

import upload_all_data as upload  # noqa: E402


def all_records():
    return (
        upload.load_eu_articles(SCRIPT_DIR)
        + upload.load_eu_recitals(SCRIPT_DIR)
        + upload.load_canadian_data()
        + upload.load_iapp_data()
    )


class DocumentFieldsTest(unittest.TestCase):
    def test_every_record_has_a_known_publisher_and_document_type(self):
        taxonomy = upload.load_taxonomy()
        for record in all_records():
            self.assertIn(record['publisher'], taxonomy['publishers'], record['_id'])
            self.assertIn(record['documentType'], taxonomy['documentTypes'], record['_id'])

    def test_old_overlapping_fields_are_gone(self):
        for record in all_records():
            for old in ('sourceType', 'category', 'type'):
                self.assertNotIn(old, record, f"{record['_id']} still has {old}")

    def test_expected_values_for_each_source(self):
        by_id = {r['_id']: r for r in all_records()}
        self.assertEqual((by_id['A50']['publisher'], by_id['A50']['documentType']), ('Government', 'Law'))
        self.assertEqual((by_id['R1']['publisher'], by_id['R1']['documentType']), ('Government', 'Law'))
        self.assertEqual((by_id['OSFI_1']['publisher'], by_id['OSFI_1']['documentType']), ('Regulator', 'Guidance'))
        self.assertEqual((by_id['KPMG_1']['publisher'], by_id['KPMG_1']['documentType']), ('Consultancy', 'Interpretation'))
        self.assertEqual(by_id['DAIS_1']['publisher'], 'Academic')
        self.assertEqual((by_id['IAPP_1']['publisher'], by_id['IAPP_1']['documentType']), ('NGO', 'Interpretation'))

    def test_a_misspelled_value_is_rejected(self):
        record = {'_id': 'X', 'chunk_text': 'x', 'publisher': 'Lawfirm', 'documentType': 'Law'}
        with self.assertRaises(ValueError):
            upload.validate_record(record)


if __name__ == '__main__':
    unittest.main()
