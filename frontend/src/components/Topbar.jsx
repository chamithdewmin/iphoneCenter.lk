import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  ArrowRight,
  Menu,
} from 'lucide-react';

// Helper to get colors based on light/dark theme
const getColors = () => {
  const root = document.documentElement;
  // If light class is present, always treat as light even if "dark" is also present
  const isLight = root.classList.contains('light');
  const isDark = !isLight && root.classList.contains('dark');
  return {
    border: isDark ? '#171717' : '#e2e8f0',
    text: isDark ? '#ffffff' : '#0f172a',
    textMuted: isDark ? '#8b9ab0' : '#64748b',
    inputBg: isDark ? '#1e293b' : '#f1f5f9',
    cardBg: isDark ? '#0a0a0a' : '#ffffff',
    pageBg: isDark ? '#000000' : '#f8fafc',
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    todayBg: '#0e5cff',
    blue: '#0e5cff',
  };
};

// Mini calendar popover
const MiniCalendar = ({ colors }) => {
  const c = colors;
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        background: c.cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        zIndex: 100,
        minWidth: 280,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: c.textMuted,
            padding: 4,
            borderRadius: 6,
            display: 'flex',
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <span
          style={{
            color: c.text,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: c.textMuted,
            padding: 4,
            borderRadius: 6,
            display: 'flex',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 8,
        }}
      >
        {daysOfWeek.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              color: c.textMuted,
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 0',
            }}
          >
            {day}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
        }}
      >
        {getDaysInMonth(currentDate).map((day, index) => (
          <div
            key={index}
            style={{
              textAlign: 'center',
              padding: '8px 0',
              fontSize: 13,
              fontWeight: isToday(day) ? 600 : 400,
              color: day ? (isToday(day) ? '#fff' : c.text) : 'transparent',
              background: isToday(day) ? c.todayBg : 'transparent',
              borderRadius: 8,
              cursor: day ? 'pointer' : 'default',
            }}
          >
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple search dropdown with recent searches only.
const SearchResults = ({ query, colors, onClose, onSelect }) => {
  const c = colors;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, Math.max(recentSearches.length - 1, 0))
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && recentSearches[selectedIndex]) {
        e.preventDefault();
        onSelect(recentSearches[selectedIndex]);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, recentSearches, onClose, onSelect]);

  const saveRecentSearch = (text) => {
    const updated = [text, ...recentSearches.filter((s) => s !== text)].slice(
      0,
      5
    );
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  useEffect(() => {
    if (query && query.length >= 2) {
      saveRecentSearch(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 8,
        background: c.cardBg,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        zIndex: 100,
        maxHeight: 420,
        overflowY: 'auto',
      }}
    >
      {(!query || query.length < 2) && recentSearches.length > 0 && (
        <div style={{ padding: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                color: c.textMuted,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Recent Searches
            </span>
            <button
              onClick={clearRecentSearches}
              style={{
                background: 'none',
                border: 'none',
                color: c.textMuted,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
          {recentSearches.map((search, i) => (
            <div
              key={i}
              onClick={() => {
                onSelect(search);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: i === selectedIndex ? c.hoverBg : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  i === selectedIndex ? c.hoverBg : 'transparent';
              }}
            >
              <Clock size={14} style={{ color: c.textMuted }} />
              <span style={{ color: c.text, fontSize: 13 }}>{search}</span>
            </div>
          ))}
        </div>
      )}

      {(!query || query.length < 2) && recentSearches.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ color: c.textMuted, fontSize: 13, margin: 0 }}>
            Type to search and we will remember your recent queries here.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 12,
            }}
          >
            <kbd
              style={{
                background: c.hoverBg,
                border: `1px solid ${c.border}`,
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 11,
                color: c.textMuted,
              }}
            >
              ↑↓
            </kbd>
            <span style={{ color: c.textMuted, fontSize: 11 }}>Navigate</span>
            <kbd
              style={{
                background: c.hoverBg,
                border: `1px solid ${c.border}`,
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 11,
                color: c.textMuted,
                marginLeft: 8,
              }}
            >
              Enter
            </kbd>
            <span style={{ color: c.textMuted, fontSize: 11 }}>Select</span>
            <kbd
              style={{
                background: c.hoverBg,
                border: `1px solid ${c.border}`,
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 11,
                color: c.textMuted,
                marginLeft: 8,
              }}
            >
              Esc
            </kbd>
            <span style={{ color: c.textMuted, fontSize: 11 }}>Close</span>
          </div>
        </div>
      )}

      {query && query.length >= 2 && (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <ArrowRight
            size={18}
            style={{
              color: c.textMuted,
              marginBottom: 6,
            }}
          />
          <p style={{ color: c.textMuted, fontSize: 13, margin: 0 }}>
            You typed: <strong>{query}</strong>
          </p>
          <p
            style={{
              color: c.textMuted,
              fontSize: 12,
              margin: '6px 0 0',
            }}
          >
            Plug your own search results here.
          </p>
        </div>
      )}
    </div>
  );
};

const Topbar = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [colors, setColors] = useState(getColors);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const calendarRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const c = colors;

  // Sync colors when theme changes (requires custom 'theme-change' event in app)
  useEffect(() => {
    const updateColors = () => setColors(getColors());
    window.addEventListener('theme-change', updateColors);
    return () => window.removeEventListener('theme-change', updateColors);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K focuses the search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSearchFocus = () => {
    setSearchOpen(true);
  };

  const handleSearchSelect = (text) => {
    setSearchQuery(text);
    inputRef.current?.focus();
  };

  return (
    <header
      style={{
        padding: '14px 24px 10px 16px',
        background: c.cardBg,
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Left: menu button + search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: 1,
          }}
        >
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            ref={searchRef}
            style={{ position: 'relative', flex: 1, maxWidth: 480 }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: c.textMuted,
                pointerEvents: 'none',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search clients, invoices, payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  // hook for real search logic
                  // eslint-disable-next-line no-console
                  console.log('Search:', searchQuery);
                }
              }}
              style={{
                width: '100%',
                paddingLeft: 38,
                paddingRight: 70,
                paddingTop: 10,
                paddingBottom: 10,
                background: c.inputBg,
                border: `1px solid ${searchOpen ? c.blue : c.border}`,
                borderRadius: 999,
                fontSize: 14,
                color: c.text,
                outline: 'none',
                fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                transition: 'border-color 0.2s',
              }}
            />

            {/* Keyboard shortcut hint */}
            {!searchOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  pointerEvents: 'none',
                }}
              >
                <kbd
                  style={{
                    background: c.hoverBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontSize: 10,
                    color: c.textMuted,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  ⌘
                </kbd>
                <kbd
                  style={{
                    background: c.hoverBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontSize: 10,
                    color: c.textMuted,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  K
                </kbd>
              </div>
            )}

            {/* Clear button */}
            {searchOpen && searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: c.textMuted,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}

            {/* Search Results Dropdown */}
            {searchOpen && (
              <SearchResults
                query={searchQuery}
                colors={c}
                onClose={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                onSelect={handleSearchSelect}
              />
            )}
          </div>
        </div>

        {/* Right side - Date & Icons */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          className="hidden sm:flex"
        >
          {/* Date pill */}
          <div
            style={{
              background: c.cardBg,
              border: `1px solid ${c.border}`,
              borderRadius: 999,
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: c.textMuted,
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {formatDate()}
            </span>
          </div>

          {/* Calendar Icon */}
          <div ref={calendarRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: 999,
                padding: 10,
                cursor: 'pointer',
                color: c.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} />
            </button>
            {calendarOpen && <MiniCalendar colors={c} />}
          </div>

          {/* Notification Icon */}
          <button
            type="button"
            style={{
              background: c.cardBg,
              border: `1px solid ${c.border}`,
              borderRadius: 999,
              padding: 10,
              cursor: 'pointer',
              color: c.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
            onClick={() => {
              // hook for notification click
              // eslint-disable-next-line no-console
              console.log('Notifications clicked');
            }}
          >
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;