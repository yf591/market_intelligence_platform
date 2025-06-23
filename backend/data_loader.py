import json
import os

def load_product_reviews():
    file_path = os.path.join(os.path.dirname(__file__), 'data', 'product_reviews.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_market_news():
    file_path = os.path.join(os.path.dirname(__file__), 'data', 'market_news.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


