
import React, { useEffect, useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductReview {
  id: string;
  product_name: string;
  category: string;
  review_text: string;
  rating: number;
  date: string;
}

interface SentimentAnalysisResult {
  sentiment: string;
  score: number;
  reason: string;
}

interface ProductReviewWithSentiment extends ProductReview {
  sentimentResult?: SentimentAnalysisResult;
  sentimentLoading?: boolean;
  sentimentError?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function ProductReviewsDashboard() {
  const [reviews, setReviews] = useState<ProductReviewWithSentiment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewsAndAnalyzeSentiment = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/product-reviews`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedReviews: ProductReview[] = await response.json();
        
        // 初期状態でレビューを設定（感情分析は後で実行）
        const initialReviews: ProductReviewWithSentiment[] = fetchedReviews.map(review => ({
          ...review,
          sentimentLoading: true
        }));
        setReviews(initialReviews);

        // 感情分析を順次実行（レート制限を回避）
        const analyzedReviews: ProductReviewWithSentiment[] = [];
        
        for (let i = 0; i < fetchedReviews.length; i++) {
          const review = fetchedReviews[i];
          
          try {
            const sentimentResponse = await fetch(`${API_BASE_URL}/api/analyze-sentiment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: review.review_text }),
            });

            if (!sentimentResponse.ok) {
              if (sentimentResponse.status === 429) {
                const errorText = await sentimentResponse.text();
                
                // APIクォータ制限の特別なハンドリング
                if (errorText.includes("API_QUOTA_EXCEEDED") || errorText.includes("quota")) {
                  analyzedReviews.push({ 
                    ...review, 
                    sentimentError: "API無料枠のリミットに達したため、感情分析を実行できません。しばらく時間をおいてから再度お試しください。", 
                    sentimentLoading: false 
                  });
                } else {
                  // レート制限の場合は待機時間を設ける
                  console.warn(`Rate limit reached for review ${review.id}, waiting...`);
                  await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒待機
                  
                  // 再試行
                  const retryResponse = await fetch(`${API_BASE_URL}/api/analyze-sentiment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: review.review_text }),
                  });
                  
                  if (retryResponse.ok) {
                    const sentimentData: SentimentAnalysisResult = await retryResponse.json();
                    analyzedReviews.push({ ...review, sentimentResult: sentimentData, sentimentLoading: false });
                  } else {
                    const retryErrorText = await retryResponse.text();
                    if (retryErrorText.includes("API_QUOTA_EXCEEDED") || retryErrorText.includes("quota")) {
                      analyzedReviews.push({ 
                        ...review, 
                        sentimentError: "API無料枠のリミットに達したため、感情分析を実行できません。しばらく時間をおいてから再度お試しください。", 
                        sentimentLoading: false 
                      });
                    } else {
                      analyzedReviews.push({ 
                        ...review, 
                        sentimentError: `再試行失敗: ${retryResponse.status}`, 
                        sentimentLoading: false 
                      });
                    }
                  }
                }
              } else {
                const errorText = await sentimentResponse.text();
                if (errorText.includes("API_QUOTA_EXCEEDED") || errorText.includes("quota")) {
                  analyzedReviews.push({ 
                    ...review, 
                    sentimentError: "API無料枠のリミットに達したため、感情分析を実行できません。しばらく時間をおいてから再度お試しください。", 
                    sentimentLoading: false 
                  });
                } else {
                  analyzedReviews.push({ 
                    ...review, 
                    sentimentError: `分析失敗: ${sentimentResponse.status}`, 
                    sentimentLoading: false 
                  });
                }
              }
            } else {
              const sentimentData: SentimentAnalysisResult = await sentimentResponse.json();
              analyzedReviews.push({ ...review, sentimentResult: sentimentData, sentimentLoading: false });
            }
            
            // 各リクエストの間に2秒の待機時間を設ける
            if (i < fetchedReviews.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
          } catch (e: any) {
            console.error(`Failed to analyze sentiment for review ${review.id}:`, e);
            analyzedReviews.push({ ...review, sentimentError: e.message, sentimentLoading: false });
          }
          
          // 1つずつ結果を更新してユーザーに進捗を表示
          setReviews([...analyzedReviews, ...initialReviews.slice(i + 1)]);
        }
        setReviews(analyzedReviews);

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewsAndAnalyzeSentiment();
  }, []);

  const getSentimentColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-600';
    if (score >= 8) return 'text-green-600';  // 8-10: 非常にポジティブ
    if (score >= 6) return 'text-green-500';  // 6-7: ポジティブ
    if (score >= 4) return 'text-gray-500';   // 4-6: ニュートラル
    if (score >= 2) return 'text-orange-500'; // 2-3: ややネガティブ
    return 'text-red-600';                    // 0-1: 非常にネガティブ
  };

  const sentimentDistribution = useMemo(() => {
    const counts = {
      'ポジティブ': 0,
      'ニュートラル': 0,
      'ネガティブ': 0,
      '未分析/エラー': 0,
    };

    reviews.forEach(review => {
      if (review.sentimentError || !review.sentimentResult) {
        counts['未分析/エラー']++;
      } else {
        const sentiment = review.sentimentResult.sentiment;
        if (sentiment === 'ポジティブ') {
          counts['ポジティブ']++;
        } else if (sentiment === 'ニュートラル') {
          counts['ニュートラル']++;
        } else if (sentiment === 'ネガティブ') {
          counts['ネガティブ']++;
        } else {
          counts['未分析/エラー']++;
        }
      }
    });
    return counts;
  }, [reviews]);

  const chartData = {
    labels: ['ポジティブ', 'ニュートラル', 'ネガティブ', '未分析/エラー'],
    datasets: [
      {
        label: 'レビュー数',
        data: [
          sentimentDistribution['ポジティブ'],
          sentimentDistribution['ニュートラル'],
          sentimentDistribution['ネガティブ'],
          sentimentDistribution['未分析/エラー'],
        ],
        backgroundColor: [
          'rgba(40, 167, 69, 0.6)',
          'rgba(108, 117, 125, 0.6)',
          'rgba(220, 53, 69, 0.6)',
          'rgba(255, 193, 7, 0.6)',
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(108, 117, 125, 1)',
          'rgba(220, 53, 69, 1)',
          'rgba(255, 193, 7, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '製品レビュー感情分布',
        font: {
          size: 18,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'レビュー数',
        },
      },
    },
  };


  if (loading) {
    return <div className="p-5 text-center text-blue-600">製品レビューと感情分析を読み込み中...</div>;
  }

  if (error) {
    return <div className="p-5 text-red-600 text-center">エラー: {error}</div>;
  }

  return (
    <div className="p-5 font-sans">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 pb-3 border-b-2 border-gray-300">製品レビューダッシュボード</h2>
      
      <div className="mb-10 p-6 border border-gray-200 rounded-lg shadow-md bg-gray-50">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{review.product_name}</h3>
            <p className="text-sm text-gray-600 mb-1">カテゴリ: {review.category}</p>
            <p className="text-sm text-gray-600 mb-3">評価: {'⭐'.repeat(review.rating)} ({review.rating}/5)</p>
            <p className="text-base leading-relaxed text-gray-700 mb-4">"{review.review_text}"</p>
            
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">感情分析:</h4>
              {review.sentimentLoading ? (
                <p className="text-blue-500 text-sm">分析中...</p>
              ) : review.sentimentError ? (
                <p className="text-red-500 text-sm">エラー: {review.sentimentError}</p>
              ) : review.sentimentResult ? (
                <>
                  <p className={`text-base font-bold ${getSentimentColor(review.sentimentResult.score)} mb-1`}>
                    {review.sentimentResult.sentiment} (スコア: {review.sentimentResult.score}/10)
                  </p>
                  {review.sentimentResult.reason && (
                    <p className="text-xs text-gray-600">理由: {review.sentimentResult.reason}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm">感情分析データなし</p>
              )}
            </div>

            <p className="text-xs text-gray-500 text-right mt-4">{review.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviewsDashboard;


