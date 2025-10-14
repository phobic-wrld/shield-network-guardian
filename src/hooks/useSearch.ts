
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'device' | 'setting' | 'security';
  path: string;
  keywords: string[];
}

const searchData: SearchResult[] = [
  {
    id: '1',
    title: 'Dashboard Overview',
    description: 'Main dashboard with network overview',
    type: 'page',
    path: '/',
    keywords: ['dashboard', 'home', 'overview', 'main']
  },
  {
    id: '2',
    title: 'Devices',
    description: 'Manage connected devices',
    type: 'page',
    path: '/devices',
    keywords: ['devices', 'connected', 'manage', 'network']
  },
  {
    id: '3',
    title: 'Security',
    description: 'Network security settings and monitoring',
    type: 'page',
    path: '/security',
    keywords: ['security', 'protection', 'firewall', 'threats']
  },
  {
    id: '4',
    title: 'Analytics',
    description: 'Network analytics and performance metrics',
    type: 'page',
    path: '/analytics',
    keywords: ['analytics', 'metrics', 'performance', 'stats']
  },
  {
    id: '5',
    title: 'Settings',
    description: 'Application and network settings',
    type: 'page',
    path: '/settings',
    keywords: ['settings', 'configuration', 'preferences']
  },
  {
    id: '6',
    title: 'Guest Access',
    description: 'Manage guest network access',
    type: 'page',
    path: '/guest-access',
    keywords: ['guest', 'access', 'visitor', 'temporary']
  },
  {
    id: '7',
    title: 'WiFi Password',
    description: 'Change WiFi network password',
    type: 'setting',
    path: '/settings',
    keywords: ['wifi', 'password', 'network', 'credentials']
  },
  {
    id: '8',
    title: 'Firewall Settings',
    description: 'Configure firewall rules',
    type: 'security',
    path: '/security',
    keywords: ['firewall', 'rules', 'protection', 'blocking']
  }
];

export const useSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults = searchData.filter(item => {
      const searchTerm = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    }).slice(0, 5); // Limit to 5 results

    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setQuery("");
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    handleSelect,
    clearSearch
  };
};
