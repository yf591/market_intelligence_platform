import React, { useEffect, useState } from 'react';

interface MarketNews {
  id: string;
  title: string;
  source: string;
  category: string;
  content_summary: string;
  date: string;
}

interface SummaryResult {
  summary: string;
  details?: { [key: string]: any };
}

interface KeywordsResult {
  keywords: string[];
  details?: { [key: string]: any };
}

interface BusinessAnalysisResult {
  market_opportunity: number;
  threat_level: number;
  investment_priority: number;
  business_impact: string;
}

interface MarketNewsWithAIResults extends MarketNews {
  generatedSummary?: SummaryResult;
  summaryLoading?: boolean;
  summaryError?: string;
  extractedKeywords?: KeywordsResult;
  keywordsLoading?: boolean;
  keywordsError?: string;
  businessAnalysis?: BusinessAnalysisResult;
  businessLoading?: boolean;
  businessError?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function MarketNewsDashboard() {
  const [news, setNews] = useState<MarketNewsWithAIResults[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsAndAnalyze = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/market-news`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedNews: MarketNews[] = await response.json();
        
        // 順次処理でAPIクォータ制限を回避
        const analyzedNews: MarketNewsWithAIResults[] = [];
        
        for (const item of fetchedNews) {
          const newItem: MarketNewsWithAIResults = { ...item };

          // 要約処理
          newItem.summaryLoading = true;
          setNews([...analyzedNews, newItem]); // 進捗を表示
          
          try {
            const summaryResponse = await fetch(`${API_BASE_URL}/api/summarize-text`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: item.content_summary }),
            });
            
            if (summaryResponse.status === 429) {
              const errorDetail = await summaryResponse.text();
              if (errorDetail.includes('API_QUOTA_EXCEEDED')) {
                newItem.summaryError = 'API無料枠のリミットに達したため、要約を実行できません。しばらく時間をおいてから再度お試しください。';
              } else {
                newItem.summaryError = 'APIリクエスト制限により要約できませんでした。';
              }
            } else if (!summaryResponse.ok) {
              const errorText = await summaryResponse.text();
              throw new Error(`Summarization failed: ${summaryResponse.status} - ${errorText}`);
            } else {
              newItem.generatedSummary = await summaryResponse.json();
            }
          } catch (e: any) {
            console.error(`Failed to summarize news ${item.id}:`, e);
            if (!newItem.summaryError) {
              newItem.summaryError = e.message;
            }
          } finally {
            newItem.summaryLoading = false;
          }

          // 少し間隔をあけてAPIレート制限を回避
          await new Promise(resolve => setTimeout(resolve, 1000));

          // キーワード抽出処理
          newItem.keywordsLoading = true;
          setNews([...analyzedNews, newItem]); // 進捗を表示
          
          try {
            const keywordsResponse = await fetch(`${API_BASE_URL}/api/extract-keywords`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: item.content_summary }),
            });
            
            if (keywordsResponse.status === 429) {
              const errorDetail = await keywordsResponse.text();
              if (errorDetail.includes('API_QUOTA_EXCEEDED')) {
                newItem.keywordsError = 'API無料枠のリミットに達したため、キーワード抽出を実行できません。しばらく時間をおいてから再度お試しください。';
              } else {
                newItem.keywordsError = 'APIリクエスト制限によりキーワード抽出できませんでした。';
              }
            } else if (!keywordsResponse.ok) {
              const errorText = await keywordsResponse.text();
              throw new Error(`Keyword extraction failed: ${keywordsResponse.status} - ${errorText}`);
            } else {
              newItem.extractedKeywords = await keywordsResponse.json();
            }
          } catch (e: any) {
            console.error(`Failed to extract keywords for news ${item.id}:`, e);
            if (!newItem.keywordsError) {
              newItem.keywordsError = e.message;
            }
          } finally {
            newItem.keywordsLoading = false;
          }

          // 少し間隔をあけてAPIレート制限を回避
          await new Promise(resolve => setTimeout(resolve, 1000));

          // ビジネス分析処理
          newItem.businessLoading = true;
          setNews([...analyzedNews, newItem]); // 進捗を表示
          
          try {
            const businessResponse = await fetch(`${API_BASE_URL}/api/analyze-business-impact`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: item.content_summary }),
            });
            
            if (businessResponse.status === 429) {
              const errorDetail = await businessResponse.text();
              if (errorDetail.includes('API_QUOTA_EXCEEDED')) {
                newItem.businessError = 'API無料枠のリミットに達したため、ビジネス分析を実行できません。しばらく時間をおいてから再度お試しください。';
              } else {
                newItem.businessError = 'APIリクエスト制限によりビジネス分析できませんでした。';
              }
            } else if (!businessResponse.ok) {
              const errorText = await businessResponse.text();
              throw new Error(`Business analysis failed: ${businessResponse.status} - ${errorText}`);
            } else {
              newItem.businessAnalysis = await businessResponse.json();
            }
          } catch (e: any) {
            console.error(`Failed to analyze business impact for news ${item.id}:`, e);
            if (!newItem.businessError) {
              newItem.businessError = e.message;
            }
          } finally {
            newItem.businessLoading = false;
          }

          // 少し間隔をあけてAPIレート制限を回避
          await new Promise(resolve => setTimeout(resolve, 1000));

          analyzedNews.push(newItem);
          setNews([...analyzedNews]); // 最終結果を更新
        }

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsAndAnalyze();
  }, []);

  if (loading) {
    return <div className="p-5 text-center text-blue-600">市場ニュースとAI分析を読み込み中...</div>;
  }

  if (error) {
    return <div className="p-5 text-red-600 text-center">エラー: {error}</div>;
  }

  return (
    <div className="p-5 font-sans">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 pb-3 border-b-2 border-gray-300">市場ニュースダッシュボード</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-1">ソース: {item.source} | カテゴリ: {item.category}</p>
            <p className="text-base leading-relaxed text-gray-700 mb-4">元の要約: {item.content_summary}</p>
            
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">AI生成要約:</h4>
              {item.summaryLoading ? (
                <p className="text-blue-500 text-sm">要約中...</p>
              ) : item.summaryError ? (
                <p className="text-red-500 text-sm">エラー: {item.summaryError}</p>
              ) : item.generatedSummary ? (
                <p className="text-base leading-relaxed text-gray-800">
                  {item.generatedSummary.summary}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">要約データなし</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">キーワード:</h4>
              {item.keywordsLoading ? (
                <p className="text-blue-500 text-sm">抽出中...</p>
              ) : item.keywordsError ? (
                <p className="text-red-500 text-sm">エラー: {item.keywordsError}</p>
              ) : item.extractedKeywords && item.extractedKeywords.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.extractedKeywords.keywords.map((keyword, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">キーワードなし</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">ビジネスインパクト分析:</h4>
              {item.businessLoading ? (
                <p className="text-blue-500 text-sm">分析中...</p>
              ) : item.businessError ? (
                <p className="text-red-500 text-sm">エラー: {item.businessError}</p>
              ) : item.businessAnalysis ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded">
                      <span className="font-medium">市場機会:</span>
                      <span className="text-green-600 font-bold ml-1">{item.businessAnalysis.market_opportunity}/10</span>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <span className="font-medium">脅威度:</span>
                      <span className="text-red-600 font-bold ml-1">{item.businessAnalysis.threat_level}/10</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <span className="font-medium">投資優先度:</span>
                      <span className="text-blue-600 font-bold ml-1">{item.businessAnalysis.investment_priority}/10</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-medium">分析:</span> {item.businessAnalysis.business_impact}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">ビジネス分析データなし</p>
              )}
            </div>

            <p className="text-xs text-gray-500 text-right mt-4">{item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketNewsDashboard;


