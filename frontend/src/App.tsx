import ProductReviewsDashboard from './components/ProductReviewsDashboard';
import MarketNewsDashboard from './components/MarketNewsDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">Market Intelligence & Consumer Insights Platform</h1>
        </div>
      </header>
      <main className="container mx-auto p-4">
        <section className="mb-8">
          <ProductReviewsDashboard />
        </section>
        <section>
          <MarketNewsDashboard />
        </section>
      </main>
    </div>
  );
}

export default App;


