
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv
import json

from data_loader import load_product_reviews, load_market_news

def clean_gemini_response(response_text: str) -> str:
    """Gemini APIのレスポンスからMarkdownコードブロックを除去"""
    response_text = response_text.strip()
    
    # Markdownコードブロックの除去
    if response_text.startswith("```json"):
        response_text = response_text[7:]  # "```json" を除去
    if response_text.startswith("```"):
        response_text = response_text[3:]  # "```" を除去
    if response_text.endswith("```"):
        response_text = response_text[:-3]  # 末尾の "```" を除去
    
    return response_text.strip()

# .envファイルから環境変数を読み込む
load_dotenv()

# Gemini APIキーの取得
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # 複数のポートを許可
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

# AIモデルの初期化
# 感情分析用
sentiment_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction="あなたは与えられたテキストの感情を分析する専門家です。感情は「ポジティブ」「ネガティブ」「ニュートラル」のいずれかで判断し、その感情スコア（0から10の範囲、10が最もポジティブ、5がニュートラル、0が最もネガティブ）と、その判断に至った理由を簡潔に日本語で説明してください。**必ず次の正確なJSON形式のみで回答してください。他のテキストは一切含めないでください**：{\"sentiment\": \"感情\", \"score\": スコア, \"reason\": \"理由\"}"
)

# 要約用
summary_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction="あなたは与えられたテキストを簡潔かつ網羅的に要約する専門家です。重要なポイントを抽出し、読みやすい形式で要約を生成してください。"
)

# キーワード抽出用
keywords_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction="あなたは与えられたテキストから主要なキーワードを抽出する専門家です。最大5つのキーワードを抽出し、**必ず次の正確なJSON形式のみで回答してください。他のテキストは一切含めないでください**：{\"keywords\": [\"キーワード1\", \"キーワード2\", \"キーワード3\"]}"
)

# ビジネス分析用
business_analysis_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction="あなたは企業戦略のビジネス分析専門家です。与えられた市場ニュースから、1)市場機会スコア（1-10、新規事業機会の可能性）、2)競合脅威レベル（1-10、競合からの脅威度）、3)投資優先度（1-10、投資検討の優先度）を分析してください。**必ず次の正確なJSON形式のみで回答してください**：{\"market_opportunity\": スコア, \"threat_level\": スコア, \"investment_priority\": スコア, \"business_impact\": \"簡潔な分析理由\"}"
)

class TextAnalysisRequest(BaseModel):
    text: str

@app.get("/api/product-reviews")
async def get_product_reviews():
    return load_product_reviews()

@app.get("/api/market-news")
async def get_market_news():
    return load_market_news()

@app.post("/api/analyze-sentiment")
async def analyze_sentiment(request: TextAnalysisRequest):
    try:
        response = await sentiment_model.generate_content_async(
            f"以下のレビューの感情を分析してください。\n\nレビュー: {request.text}"
        )
        
        # Gemini APIのレスポンステキストを取得
        response_text = response.text.strip()
        print(f"[DEBUG] Gemini API Response: {response_text}")  # デバッグログ追加
        
        # Markdownコードブロックの除去
        cleaned_text = clean_gemini_response(response_text)
        print(f"[DEBUG] Cleaned Response: {cleaned_text}")  # クリーニング後のレスポンス
        
        try:
            # JSONとしてパース
            sentiment_data = json.loads(cleaned_text)
            print(f"[DEBUG] Parsed JSON: {sentiment_data}")  # デバッグログ追加
            
            # 必要なフィールドが存在するかチェック
            if "sentiment" not in sentiment_data or "score" not in sentiment_data:
                # フォールバック: 基本的な構造を作成
                sentiment_data = {
                    "sentiment": sentiment_data.get("sentiment", "ニュートラル"),
                    "score": sentiment_data.get("score", 0.0),
                    "reason": sentiment_data.get("reason", "分析に問題がありました")
                }
                print(f"[DEBUG] Using fallback data: {sentiment_data}")  # デバッグログ追加
                
            return sentiment_data
            
        except json.JSONDecodeError as e:
            print(f"[DEBUG] JSON Parse Error: {e}")  # デバッグログ追加
            # JSONパース失敗時のフォールバック
            return {
                "sentiment": "ニュートラル",
                "score": 0.0,
                "reason": f"分析結果の解析に失敗しました。元のレスポンス: {cleaned_text[:100]}..."
            }
            
    except Exception as e:
        error_message = str(e)
        # APIレート制限エラーの検出
        if "429" in error_message or "quota" in error_message.lower() or "rate limit" in error_message.lower():
            raise HTTPException(
                status_code=429, 
                detail="API_QUOTA_EXCEEDED"
            )
        else:
            raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {e}")

@app.post("/api/summarize-text")
async def summarize_text(request: TextAnalysisRequest):
    try:
        response = await summary_model.generate_content_async(
            f"以下のニュース記事を要約してください。\n\n記事: {request.text}"
        )
        # Gemini APIのレスポンスは直接要約テキストを返す想定
        return {"summary": response.text}
    except Exception as e:
        error_message = str(e)
        # APIレート制限エラーの検出
        if "429" in error_message or "quota" in error_message.lower() or "rate limit" in error_message.lower():
            raise HTTPException(
                status_code=429, 
                detail="API_QUOTA_EXCEEDED"
            )
        else:
            raise HTTPException(status_code=500, detail=f"Text summarization failed: {e}")

@app.post("/api/extract-keywords")
async def extract_keywords(request: TextAnalysisRequest):
    try:
        response = await keywords_model.generate_content_async(
            f"以下のテキストから主要なキーワードを抽出してください。\n\nテキスト: {request.text}"
        )
        
        # Gemini APIのレスポンステキストを取得
        response_text = response.text.strip()
        
        # Markdownコードブロックの除去
        cleaned_text = clean_gemini_response(response_text)
        
        try:
            # JSONとしてパース
            keywords_data = json.loads(cleaned_text)
            
            # キーワードフィールドが存在するかチェック
            if "keywords" not in keywords_data:
                keywords_data = {"keywords": []}
                
            return keywords_data
            
        except json.JSONDecodeError:
            # JSONパース失敗時のフォールバック
            return {
                "keywords": [],
                "error": f"キーワード抽出結果の解析に失敗しました。元のレスポンス: {cleaned_text[:100]}..."
            }
            
    except Exception as e:
        error_message = str(e)
        # APIレート制限エラーの検出
        if "429" in error_message or "quota" in error_message.lower() or "rate limit" in error_message.lower():
            raise HTTPException(
                status_code=429, 
                detail="API_QUOTA_EXCEEDED"
            )
        else:
            raise HTTPException(status_code=500, detail=f"Keyword extraction failed: {e}")

@app.post("/api/analyze-business-impact")
async def analyze_business_impact(request: TextAnalysisRequest):
    try:
        response = await business_analysis_model.generate_content_async(
            f"以下の市場ニュースをビジネス視点で分析してください。\n\nニュース: {request.text}"
        )
        
        # Gemini APIのレスポンステキストを取得
        response_text = response.text.strip()
        
        # Markdownコードブロックの除去
        cleaned_text = clean_gemini_response(response_text)
        
        try:
            # JSONとしてパース
            business_data = json.loads(cleaned_text)
            
            # 必要なフィールドが存在するかチェック
            required_fields = ["market_opportunity", "threat_level", "investment_priority"]
            for field in required_fields:
                if field not in business_data:
                    business_data[field] = 5  # デフォルト値
                    
            if "business_impact" not in business_data:
                business_data["business_impact"] = "分析結果が不完全でした"
                
            return business_data
            
        except json.JSONDecodeError:
            # JSONパース失敗時のフォールバック
            return {
                "market_opportunity": 5,
                "threat_level": 5,
                "investment_priority": 5,
                "business_impact": f"ビジネス分析結果の解析に失敗しました。元のレスポンス: {cleaned_text[:100]}..."
            }
            
    except Exception as e:
        error_message = str(e)
        # APIレート制限エラーの検出
        if "429" in error_message or "quota" in error_message.lower() or "rate limit" in error_message.lower():
            raise HTTPException(
                status_code=429, 
                detail="API_QUOTA_EXCEEDED"
            )
        else:
            raise HTTPException(status_code=500, detail=f"Business analysis failed: {e}")


