import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaChartLine } from 'react-icons/fa';
import Spinner from '../layout/Spinner';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PriceChart = ({ baseAsset, counterAsset }) => {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState(null);
  const [resolution, setResolution] = useState('day');
  const [error, setError] = useState('');

  useEffect(() => {
    if (baseAsset && counterAsset) {
      fetchPriceHistory();
    }
  }, [baseAsset, counterAsset, resolution]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/sdex/history', {
        params: {
          baseAsset,
          counterAsset,
          resolution
        }
      });
      
      setPriceData(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError('Could not load price history');
    } finally {
      setLoading(false);
    }
  };

  // Format asset code for display
  const formatAssetCode = (assetString) => {
    if (!assetString) return '';
    const [code, issuer] = assetString.split(':');
    return issuer ? `${code}` : code;
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!priceData || !priceData.data) return null;

    const labels = priceData.data.map(item => {
      const date = new Date(item.timestamp);
      if (resolution === 'hour') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (resolution === 'day') {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    });

    const prices = priceData.data.map(item => parseFloat(item.price));
    const volumes = priceData.data.map(item => item.volume);

    return {
      labels,
      datasets: [
        {
          label: `Price (${formatAssetCode(counterAsset)})`,
          data: prices,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Volume',
          data: volumes,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderWidth: 1,
          type: 'bar',
          yAxisID: 'y1'
        }
      ]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: `Price (${formatAssetCode(counterAsset)})`
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Volume'
        }
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${formatAssetCode(baseAsset)}/${formatAssetCode(counterAsset)} Price History`
      },
    },
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <FaChartLine className="mr-2 text-blue-500" /> Price Chart
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded ${resolution === 'hour' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setResolution('hour')}
          >
            Hourly
          </button>
          <button
            className={`px-4 py-2 rounded ${resolution === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setResolution('day')}
          >
            Daily
          </button>
          <button
            className={`px-4 py-2 rounded ${resolution === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setResolution('week')}
          >
            Weekly
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        priceData && priceData.data && (
          <div className="h-64 md:h-96">
            <Line data={prepareChartData()} options={chartOptions} />
          </div>
        )
      )}
      
      {priceData && priceData.data && (
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-semibold text-gray-700">Latest Price</div>
            <div className="text-lg">
              {parseFloat(priceData.data[priceData.data.length - 1].price).toFixed(6)} {formatAssetCode(counterAsset)}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-semibold text-gray-700">24h Change</div>
            {priceData.data.length > 1 && (
              <div className={`text-lg ${calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculateChange() >= 0 ? '+' : ''}{calculateChange().toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Calculate 24h price change
  function calculateChange() {
    if (!priceData || !priceData.data || priceData.data.length < 2) return 0;
    
    const latestPrice = parseFloat(priceData.data[priceData.data.length - 1].price);
    const previousPrice = parseFloat(priceData.data[0].price);
    
    return ((latestPrice - previousPrice) / previousPrice) * 100;
  }
};

export default PriceChart;
