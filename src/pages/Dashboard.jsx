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
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const filteredHistory = drinkHistory.filter((drink) => drink.consumed_at >= oneDayAgo);

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

    const timePoints = generateTimeSeries(oneDayAgo, now, intervalMs);
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
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo5.jpg" alt="Logo" />
          <h1 className="logo-text">Zarurat-e-Coffee</h1>
        </div>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="neon-button">🏠 Home</button>
          <button onClick={handleLogout} className="logout">Logout</button>
        </div>
      </header>

      <main className="dashboard-container">
        <div className="cards-group">
          <section className="card" style={{ backgroundColor: status.background, color: status.color, border: `2px solid ${status.color}20`, position: 'relative', overflow: 'hidden' }}>
            <div style={{position: 'absolute', top: 0, right: 0, fontSize: '10rem', opacity: 0.06, color: status.color, transform: 'rotate(15deg) translate(20%, -20%)', pointerEvents: 'none'}}>⚡</div>
            <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: status.color, textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)', fontWeight: 800}}>
              <span style={{fontSize: '1.2rem'}}>⚡</span>
              CURRENT CAFFEINE LEVEL
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem'}}>
              <p className="caffeine-level">
                {currentCaffeine.toFixed(2)}
                <span style={{fontSize: '2.25rem', fontWeight: 700, marginLeft: '0.25rem'}}>mg</span>
              </p>
              <p className="status-desc" style={{color: status.color}}>{status.description}</p>
            </div>
          </section>

          <section className="card">
            <h2>Daily Stats</h2>
            <p><span style={{color: '#00809D', fontSize: '1.1rem'}}>⚡</span> Avg. Caffeine: <strong style={{color: '#F8FAFC'}}>{stats.daily_caffeine} mg</strong></p>
            <p><span style={{color: '#FF7601', fontSize: '1.1rem'}}>₹</span> Daily Spend: <strong style={{color: '#F8FAFC'}}>₹{stats.daily_cost}</strong></p>
            <p><span style={{color: '#00809D', fontSize: '1.1rem'}}>☕</span> Coffees/Day: <strong style={{color: '#F8FAFC'}}>{stats.average_coffees}</strong></p>
            <p><span style={{color: '#FF7601', fontSize: '1.1rem'}}>💰</span> Total Spend: <strong style={{color: '#F8FAFC'}}>₹{stats.total_cost}</strong></p>
          </section>

          <section className="card">
            <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <span style={{fontSize: '1.2rem'}}>🏆</span>
              All Time Top 3 Drinks
            </h2>
            <ul>
              {topCoffees.map((drink, idx) => (
                <li key={idx}>
                  <strong style={{color: idx === 0 ? '#FF7601' : '#F8FAFC', fontSize: '1.05rem'}}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {drink.coffeeName}
                  </strong>
                  <span style={{color: '#94A3B8', marginLeft: '0.5rem'}}>— {drink.count} cups</span>
                  <br />
                  <span style={{fontSize: '0.85rem', color: '#94A3B8'}}>
                    {drink.timestamps.map((ts, i) => (
                      <span key={i}>🕒 {timeSinceConsumption(ts)} ago{i < drink.timestamps.length - 1 && ', '}</span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="chart-card">
          <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <span style={{fontSize: '1.2rem'}}>📈</span>
            Caffeine Over Time (Last 24h)
          </h2>
          <Line data={chartData} options={{
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                ticks: {
                  color: '#94A3B8',
                  maxRotation: 0,
                  autoSkipPadding: 20
                },
                grid: {
                  color: 'rgba(148, 163, 184, 0.1)'
                }
              },
              y: {
                ticks: {
                  color: '#94A3B8'
                },
                grid: {
                  color: 'rgba(148, 163, 184, 0.1)'
                }
              }
            }
          }} />
        </section>

        <div className="button-group">
          <button onClick={handleLogDrinkClick} className="neon-button">Log a Drink</button>
          <button onClick={handleViewHistoryClick} className="neon-button">View History</button>
        </div>
      </main>
    </div>
  );
}

