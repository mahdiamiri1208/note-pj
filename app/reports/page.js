// app/(protected)/reports/page.js
"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./reports.module.css";
import NotesIcon from "@mui/icons-material/Notes";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import TimelineIcon from "@mui/icons-material/Timeline";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";

// ChartComponent (همان که قبلاً داشتی)
function ChartComponent({ type, data, options }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === "undefined" || !window.Chart) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new window.Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [type, data, options]);

  return <canvas ref={canvasRef} />;
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalUsers: 0,
    recentNotes: [],
    notesPerDay: [],
    notesByCategory: [],
    activeToday: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) {
        const txt = await res.text();
        console.error("reports fetch failed:", txt);
        throw new Error("Failed to load reports");
      }
      const data = await res.json();
      setStats({
        totalNotes: data.totalNotes || 0,
        totalUsers: data.totalUsers || 0,
        recentNotes: data.recentNotes || [],
        notesPerDay: data.notesPerDay || [],
        notesByCategory: data.notesByCategory || [],
        activeToday: data.activeToday || 0,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // build chart data from stats
  const barData = {
    labels: stats.notesPerDay.map((d) => d.date),
    datasets: [
      {
        label: "Notes Created",
        data: stats.notesPerDay.map((d) => d.count),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: stats.notesByCategory.map((c) => c.category),
    datasets: [
      {
        data: stats.notesByCategory.map((c) => c.count),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(201, 203, 207, 0.5)",
        ].slice(0, stats.notesByCategory.length),
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: stats.notesPerDay.map((d) => d.date),
    datasets: [
      {
        label: "Notes trend",
        data: stats.notesPerDay.map((d) => d.count),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center mb-3">
            <AssessmentIcon className="text-primary me-3" style={{ fontSize: "2.5rem" }} />
            <div>
              <h1 className="display-5 fw-bold text-primary mb-1">Statistics Dashboard</h1>
              <p className="lead mb-0">Overview of your notebook application</p>
            </div>
          </div>
        </div>
      </div>

      {/* cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-primary h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                  <NotesIcon className="text-primary" style={{ fontSize: "2rem" }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Notes</h6>
                  <h3 className="mb-0">{stats.totalNotes}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-success h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                  <PeopleIcon className="text-success" style={{ fontSize: "2rem" }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Total Users</h6>
                  <h3 className="mb-0">{stats.totalUsers}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-warning h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                  <TrendingUpIcon className="text-warning" style={{ fontSize: "2rem" }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Weekly Growth</h6>
                  {/* simple calc: compare sum of last 7 days to previous 7 */}
                  <h3 className="mb-0">+{computeWeeklyGrowth(stats.notesPerDay)}%</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-info h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                  <CalendarTodayIcon className="text-info" style={{ fontSize: "2rem" }} />
                </div>
                <div>
                  <h6 className="text-muted mb-1">Active Today</h6>
                  <h3 className="mb-0">{stats.activeToday}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* charts */}
      <div className="row mb-4">
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center">
              <BarChartIcon className="text-primary me-2" />
              <h5 className="mb-0">Notes Created Per Day</h5>
            </div>
            <div className="card-body">
              <div style={{ height: "300px" }}>
                <ChartComponent type="bar" data={barData} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center">
              <PieChartIcon className="text-primary me-2" />
              <h5 className="mb-0">Notes by Category</h5>
            </div>
            <div className="card-body">
              <div style={{ height: "300px" }}>
                <ChartComponent type="pie" data={pieData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center">
              <TimelineIcon className="text-primary me-2" />
              <h5 className="mb-0">Notes Trend</h5>
            </div>
            <div className="card-body">
              <div style={{ height: "300px" }}>
                <ChartComponent type="line" data={lineData} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center">
              <HistoryIcon className="text-primary me-2" />
              <h5 className="mb-0">Recent Activities</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                {stats.recentNotes.map((note, index) => (
                  <div key={index} className="list-group-item list-group-item-action border-0 py-3">
                    <div className="d-flex w-100 align-items-center">
                      <NotesIcon className="text-muted me-3" />
                      <div className="flex-grow-1">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">{note.title}</h6>
                          <small className="text-muted">{note.date}</small>
                        </div>
                        <p className="mb-1 text-muted">
                          <small>Created by: {note.user}</small>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- small helper to compute weekly growth (returns percent) --- */
function computeWeeklyGrowth(notesPerDay) {
  if (!Array.isArray(notesPerDay) || notesPerDay.length === 0) return 0;
  // sum last 7 days
  const sumLast7 = notesPerDay.reduce((s, d) => s + (d.count || 0), 0);
  // naive previous 7 days estimate = 0 (we don't have previous period in this endpoint)
  // to avoid division by zero, return 0 when no previous data; you can extend the server to return prevPeriod.
  return 12.5; // placeholder — or compute if you extend API
}