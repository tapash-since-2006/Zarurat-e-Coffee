import React, { useEffect, useState, useCallback } from 'react';
import {
  calculateCurrentCaffeineLevel,
  getTopThreeCoffeesWithTimestamps,
  calculateCoffeeStats,
  timeSinceConsumption,
  statusLevels,
} from '../utility/index';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { useModal } from '../Context/ModalContext';
import LogDrinkModal from './LogDrinkModal';
import ViewHistoryModal from './ViewHistoryModal';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale);

function getStatusLevel(caffeine) {
  if (caffeine <= statusLevels.veryLow.maxLevel) return statusLevels.veryLow;
  if (caffeine <= statusLevels.low.maxLevel) return statusLevels.low;
  if (caffeine <= statusLevels.moderate.maxLevel) return statusLevels.moderate;
  return statusLevels.high;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentCaffeine, setCurrentCaffeine] = useState(0);
  const [topCoffees, setTopCoffees] = useState([]);
  const [stats, setStats] = useState({});
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('consumed_at', { ascending: true });

      if (error) console.error('Error fetching history:', error);
      else setHistory(data);
    }
    fetchHistory();
  }, []);

  const updateChart = useCallback((drinkHistory) => {
    if (drinkHistory.length === 0) return;

    const now = Date.now();
    const twentyHoursAgo = now - 20 * 60 * 60 * 1000;
    const fourHoursAhead = now + 4 * 60 * 60 * 1000;
    const filteredHistory = drinkHistory.filter((drink) => drink.consumed_at >= twentyHoursAgo);

    if (filteredHistory.length === 0) {
      setChartData({
        labels: [],
        datasets: [{
          label: 'Caffeine Level (mg)',
          data: [],
          borderColor: '#00809D',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
        }],
      });
      return;
    }

    const intervalMs = 5 * 60 * 1000;
    const halfLife = 5;

    const generateTimeSeries = (start, end, intervalMs) => {
      const times = [];
      for (let t = start; t <= end; t += intervalMs) times.push(t);
      return times;
    };

    const decay = (mg, elapsedMs) => {
      const hours = elapsedMs / 3600000;
      return mg * Math.pow(0.5, hours / halfLife);
    };

    const timePoints = generateTimeSeries(twentyHoursAgo, fourHoursAhead, intervalMs);
    const caffeineOverTime = timePoints.map((ts) =>
      filteredHistory.reduce((sum, drink) => {
        if (drink.consumed_at <= ts) {
          const elapsed = ts - drink.consumed_at;
          return sum + decay(drink.caffeine_mg, elapsed);
        }
        return sum;
      }, 0)
    );

    setChartData({
      labels: timePoints.map((ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
      datasets: [{
        label: 'Caffeine Level (mg)',
        data: caffeineOverTime,
        borderColor: '#00809D',
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
      }],
    });
  }, []);

  useEffect(() => {
    setCurrentCaffeine(parseFloat(calculateCurrentCaffeineLevel(history)));
    setTopCoffees(getTopThreeCoffeesWithTimestamps(history));
    setStats(calculateCoffeeStats(history));
    updateChart(history);
  }, [history, updateChart]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateChart(history);
    }, 120000);
    return () => clearInterval(interval);
  }, [updateChart, history]);

  const handleLogDrinkClick = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return console.error('User not authenticated', error);
    openModal(
      <LogDrinkModal
        userId={user.id}
        onSelect={(name, caffeine, cost) => {
          const newEntry = {
            user_id: user.id,
            name,
            caffeine_mg: Number(caffeine),
            cost: Number(cost),
            consumed_at: Date.now(),
          };
          const updated = [...history, newEntry].sort((a, b) => a.consumed_at - b.consumed_at);
          setHistory(updated);
          closeModal();
        }}
        onClose={closeModal}
      />
    );
  };

  const handleViewHistoryClick = () =>
    openModal(<ViewHistoryModal history={history} onClose={closeModal} />);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/');
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!user) {
    navigate('/');
    return null;
  }

  const status = getStatusLevel(currentCaffeine);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => navigate('/')}>
            <img src="/logo5.jpg" alt="Logo" className="logo-img" />
            <h1 className="logo-text">Zarurat-e-Coffee</h1>
          </div>
          <div className="header-buttons">
            <button onClick={() => navigate('/')} className="btn-home">
              Home
            </button>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-title-section">
          <h2 className="page-title">Your Dashboard</h2>
          <p className="page-subtitle">Track your caffeine intake and monitor your daily habits</p>
        </div>

        <div className="grid-1-3">
          <section
            className="caffeine-card card span-1"
            style={{
              backgroundColor: status.background,
              borderColor: status.color,
              backgroundImage: `radial-gradient(circle at 100% 0%, ${status.color}15, transparent 50%)`
            }}
          >
            <div className="caffeine-card-bg" style={{ color: status.color }}>
              ⚡
            </div>
            <div className="caffeine-card-content">
              <div className="card-header">
                <div className="card-icon" style={{ backgroundColor: `${status.color}20` }}>
                  <span>⚡</span>
                </div>
                <h3 className="card-title" style={{ color: status.color }}>
                  Current Level
                </h3>
              </div>
              <div className="caffeine-display">
                <div className="caffeine-value">
                  <span className="caffeine-number" style={{ color: status.color }}>
                    {currentCaffeine.toFixed(0)}
                  </span>
                  <span className="caffeine-unit" style={{ color: status.color }}>
                    mg
                  </span>
                </div>
                <div className="caffeine-status-badge" style={{ backgroundColor: `${status.color}15` }}>
                  <p className="caffeine-status-text" style={{ color: status.color }}>
                    {status.description}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card span-2">
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: '#dbeafe' }}>
                <span>📊</span>
              </div>
              <h3 className="card-title" style={{ color: '#0f172a' }}>Statistics Overview</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-header">
                  <span className="stat-icon">⚡</span>
                  <p className="stat-label">Avg. Caffeine</p>
                </div>
                <p className="stat-value blue">{stats.daily_caffeine}<span className="stat-unit">mg</span></p>
              </div>

              <div className="stat-card amber">
                <div className="stat-header">
                  <span className="stat-icon">₹</span>
                  <p className="stat-label">Daily Spend</p>
                </div>
                <p className="stat-value amber">₹{stats.daily_cost}</p>
              </div>

              <div className="stat-card slate">
                <div className="stat-header">
                  <span className="stat-icon">☕</span>
                  <p className="stat-label">Coffees/Day</p>
                </div>
                <p className="stat-value slate">{stats.average_coffees}</p>
              </div>

              <div className="stat-card emerald">
                <div className="stat-header">
                  <span className="stat-icon">💰</span>
                  <p className="stat-label">Total Spend</p>
                </div>
                <p className="stat-value emerald">₹{stats.total_cost}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid-1-3">
          <section className="card span-2">
            <div className="chart-header">
              <div className="card-icon" style={{ backgroundColor: '#dbeafe' }}>
                <span>📈</span>
              </div>
              <h3 className="card-title" style={{ color: '#0f172a' }}>Caffeine Timeline</h3>
              <span className="chart-badge">20h past to 4h ahead</span>
            </div>
            <div className="chart-container">
              <Line
                data={{
                  ...chartData,
                  datasets: [{
                    ...chartData.datasets[0],
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: window.innerWidth < 640 ? 2.5 : 2,
                    pointBackgroundColor: '#1e3a8a',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: window.innerWidth < 640 ? 0 : 3,
                    pointHoverRadius: window.innerWidth < 640 ? 0 : 6,
                    pointHoverBackgroundColor: '#1e3a8a',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  aspectRatio: window.innerWidth < 640 ? 1.5 : window.innerWidth < 1024 ? 2 : 2.5,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: window.innerWidth >= 640,
                      backgroundColor: 'rgba(30, 58, 138, 0.9)',
                      padding: 12,
                      cornerRadius: 8,
                      titleFont: { size: 14, weight: 'bold' },
                      bodyFont: { size: 13 },
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: '#64748b',
                        font: { size: window.innerWidth < 640 ? 8 : 11 },
                        maxRotation: 0,
                        autoSkipPadding: window.innerWidth < 640 ? 40 : 20,
                        maxTicksLimit: window.innerWidth < 640 ? 5 : undefined
                      },
                      grid: {
                        display: window.innerWidth >= 640,
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                      }
                    },
                    y: {
                      ticks: {
                        color: '#64748b',
                        font: { size: window.innerWidth < 640 ? 9 : 11 },
                        callback: (value) => value + ' mg',
                        maxTicksLimit: window.innerWidth < 640 ? 4 : undefined
                      },
                      grid: {
                        display: window.innerWidth >= 640,
                        color: 'rgba(148, 163, 184, 0.1)',
                        drawBorder: false
                      }
                    }
                  }
                }}
              />
            </div>
          </section>

          <section className="card span-1">
            <div className="card-header">
              <div className="card-icon" style={{ backgroundColor: '#fef3c7' }}>
                <span>🏆</span>
              </div>
              <h3 className="card-title" style={{ color: '#0f172a' }}>Top Drinks</h3>
            </div>
            <ul className="drinks-list">
              {topCoffees.map((drink, idx) => (
                <li key={idx} className="drink-item">
                  <div className="drink-content">
                    <span className="drink-medal">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                    <div className="drink-info">
                      <div className="drink-header">
                        <p className="drink-name">
                          {drink.coffeeName}
                        </p>
                        <span className="drink-count">
                          {drink.count}x
                        </span>
                      </div>
                      <div className="drink-timestamps">
                        {drink.timestamps.slice(0, 2).map((ts, i) => (
                          <div key={i} className="timestamp-item">
                            <span>⏱</span>
                            <span>{timeSinceConsumption(ts)} ago</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="action-buttons">
          <button onClick={handleLogDrinkClick} className="btn-primary">
            <span>☕</span> Log a Drink
          </button>
          <button onClick={handleViewHistoryClick} className="btn-secondary">
            <span>📜</span> View History
          </button>
        </div>
      </main>
    </div>
  );
}
