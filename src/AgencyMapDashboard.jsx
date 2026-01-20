import React, { useState, useEffect, useRef } from 'react';
import { Search, Map as MapIcon, Layers, Filter, Star, Info, List, Crosshair, ChevronRight, X, Check, ChevronDown, ChevronUp, RotateCcw, FileText, Coins } from 'lucide-react';

// --- Configuration & Constants ---

const STATUS_GROUPS = {
  'pending': { label: 'รอดำเนินการ', color: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', ring: 'ring-red-200' },
  'progress': { label: 'กำลังดำเนินการ', color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-200' },
  'done': { label: 'เสร็จสิ้น', color: 'bg-green-500', text: 'text-green-600', border: 'border-green-500', ring: 'ring-green-200' },
  'irrelevant': { label: 'ไม่เกี่ยวข้อง', color: 'bg-gray-400', text: 'text-gray-500', border: 'border-gray-400', ring: 'ring-gray-200' }
};

const USER_DEFINED_STATUSES = [
  { id: 'new', label: 'แจ้งใหม่', group: 'pending' },
  { id: 'assigning', label: 'รอจัดสรรเจ้าหน้าที่', group: 'pending' },
  { id: 'fixing', label: 'กำลังซ่อมแซม', group: 'progress' },
  { id: 'investigating', label: 'กำลังตรวจสอบ', group: 'progress' },
  { id: 'budget', label: 'ของบประมาณ', group: 'progress' },
  { id: 'procurement', label: 'จัดซื้อจัดจ้าง', group: 'progress' },
  { id: 'completed', label: 'แก้ไขเรียบร้อย', group: 'done' },
  { id: 'forwarded', label: 'ส่งต่อหน่วยงานอื่น', group: 'irrelevant' },
  { id: 'duplicate', label: 'เรื่องซ้ำซ้อน', group: 'irrelevant' }
];

const CATEGORIES = [
  'น้ำท่วมขัง', 'ฝาท่อชำรุด', 'ขยะตกค้าง', 'ไฟส่องสว่าง', 'ทางเท้าชำรุด', 'ต้นไม้ล้ม', 'เรื่องร้องเรียนทั่วไป',
  'ป้ายจราจรชำรุด', 'ทางม้าลายเลือน', 'ส่งกลิ่นเหม็น', 'สัตว์มีพิษรบกวน', 'ก่อสร้างรบกวน', 'หาบเร่แผงลอย',
  'จอดรถกีดขวาง', 'รถโดยสารสาธารณะ', 'ความปลอดภัย', 'สวนสาธารณะ'
];

// Helper Functions
const getCategoryIconSVG = (category) => {
  const icons = {
    'น้ำท่วมขัง': '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>',
    'ไฟส่องสว่าง': '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>',
    'ต้นไม้ล้ม': '<path d="M8 19h8a4 4 0 0 0 3.8-2.8 4 4 0 0 0-1.6-4.5c.3-.5.4-1.1.4-1.7a4 4 0 0 0-4-4 4 4 0 0 0-3.6 2.4A4 4 0 0 0 8 4a4 4 0 0 0-3 6.6A4 4 0 0 0 3 14a4 4 0 0 0 5 5z"></path><path d="M12 19v3"></path>',
    'ฝาท่อชำรุด': '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>',
    'default': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
  };
  return icons[category] || icons['default'];
};

const getHeatColor = (density) => {
  if (density > 0.8) return '#ef4444';
  if (density > 0.6) return '#f97316';
  if (density > 0.4) return '#eab308';
  if (density > 0.2) return '#22c55e';
  return '#3b82f6';
};

// Mock Data
const generateMockCases = (count) => {
  const cases = [];
  const hotspots = [
    { lat: 13.7563, lng: 100.5018, weight: 0.4 },
    { lat: 13.7469, lng: 100.5348, weight: 0.3 },
    { lat: 13.7278, lng: 100.5241, weight: 0.2 },
    { lat: 13.8000, lng: 100.5500, weight: 0.1 }
  ];

  for (let i = 1; i <= count; i++) {
    const rand = Math.random();
    let hotspot = hotspots[0];
    let accum = 0;
    for (let h of hotspots) {
      accum += h.weight;
      if (rand <= accum) { hotspot = h; break; }
    }
    const spread = (Math.random() > 0.8) ? 0.04 : 0.012; 
    const lat = hotspot.lat + (Math.random() - 0.5) * spread;
    const lng = hotspot.lng + (Math.random() - 0.5) * spread;
    const statusObj = USER_DEFINED_STATUSES[Math.floor(Math.random() * USER_DEFINED_STATUSES.length)];
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const isRated = Math.random() > 0.3; // 30% unrated
    
    cases.push({
      id: `CS-${2024000 + i}`,
      title: `${category} บริเวณจุดที่ ${i}`,
      lat: lat,
      lng: lng,
      status: statusObj.id,
      statusLabel: statusObj.label,
      statusGroup: statusObj.group,
      categories: [category],
      rating: isRated ? Math.floor(Math.random() * 5) + 1 : 0, // 0 = No Rating
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toLocaleDateString('th-TH'),
      description: 'พบปัญหาบริเวณพื้นที่ดังกล่าว ทำให้เกิดความไม่สะดวกในการสัญจร',
      reporter: `ประชาชน ${i}`,
      image: `https://picsum.photos/300/200?random=${i}`
    });
  }
  return cases;
};

const INITIAL_CASES = generateMockCases(600);

// --- Components ---

const StarRating = ({ rating }) => {
  if (!rating || rating === 0) return <span className="text-gray-400 text-xs">- ยังไม่มีการประเมิน -</span>;
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
      ))}
    </div>
  );
};

export default function AgencyMapDashboard() {
  const [cases, setCases] = useState(INITIAL_CASES);
  const [filteredCases, setFilteredCases] = useState(INITIAL_CASES);
  
  // --- STATE MANAGEMENT ---
  
  const getIdsForGroup = (group) => USER_DEFINED_STATUSES.filter(s => s.group === group).map(s => s.id);
  const getAllStatusIds = () => USER_DEFINED_STATUSES.map(s => s.id);

  // Init Filters (Temp States)
  const [tempStatusIds, setTempStatusIds] = useState(getAllStatusIds());
  const [tempRating, setTempRating] = useState([1, 2, 3, 4, 5, 0]); 
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [tempCategories, setTempCategories] = useState(CATEGORIES);

  // Applied Filters (Real States)
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    statusIds: getAllStatusIds(),
    categories: CATEGORIES,
    rating: [1, 2, 3, 4, 5, 0]
  });

  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [expandedStatusGroup, setExpandedStatusGroup] = useState(null);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false); // Start Hidden
  
  // Dirty State Check
  const isFilterDirty = React.useMemo(() => {
    return (
        tempSearchTerm !== appliedFilters.searchTerm ||
        JSON.stringify(tempStatusIds.sort()) !== JSON.stringify(appliedFilters.statusIds.sort()) ||
        JSON.stringify(tempCategories.sort()) !== JSON.stringify(appliedFilters.categories.sort()) ||
        JSON.stringify(tempRating.sort()) !== JSON.stringify(appliedFilters.rating.sort())
    );
  }, [tempSearchTerm, tempStatusIds, tempCategories, tempRating, appliedFilters]);

  const [viewMode, setViewMode] = useState('marker');
  const [selectedCase, setSelectedCase] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapZoom, setMapZoom] = useState(12); // Track Zoom for Clustering

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Changed: Use LayerGroup instead of array of layers
  const layerGroupRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Fix Map Resize Issue ---
  useEffect(() => {
    if (mapInstanceRef.current) {
        // Wait for sidebar transition to finish (300ms)
        setTimeout(() => {
            mapInstanceRef.current.invalidateSize();
        }, 300);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => initMap();
    document.body.appendChild(script);
  }, []);

  // --- Filtering Logic (Applied only) ---
  useEffect(() => {
    let result = cases;
    const { searchTerm, statusIds, categories, rating } = appliedFilters;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(lower) || 
        c.id.toLowerCase().includes(lower) ||
        c.categories.some(cat => cat.includes(lower))
      );
    }

    result = result.filter(c => statusIds.includes(c.status));
    result = result.filter(c => c.categories.some(cat => categories.includes(cat)));

    if (rating.length > 0) {
      result = result.filter(c => rating.includes(c.rating));
    } else {
       result = [];
    }

    setFilteredCases(result);
  }, [appliedFilters, cases]);

  // --- Better Cluster Logic (Zoom Aware) ---
  const getZoomAwareClusters = (points, map) => {
    // 1. Project all points to pixel coordinates based on current zoom
    // 2. Simple distance check in pixels
    const clusterRadiusPx = 50; // pixels
    const clusters = [];
    const processed = new Set();

    points.forEach((point, i) => {
        if (processed.has(i)) return;
        if (!point.lat || !point.lng) return; // Safety check
        
        // Leaflet method to get pixel point relative to container
        const p1 = map.latLngToLayerPoint([point.lat, point.lng]);

        const cluster = { lat: point.lat, lng: point.lng, count: 1, ids: [point] };
        processed.add(i);

        for (let j = i + 1; j < points.length; j++) {
            if (processed.has(j)) continue;
            
            const p2 = map.latLngToLayerPoint([points[j].lat, points[j].lng]);
            const dist = p1.distanceTo(p2); // Pixel distance

            if (dist <= clusterRadiusPx) {
                cluster.count++;
                cluster.ids.push(points[j]);
                processed.add(j);
            }
        }
        clusters.push(cluster);
    });
    return clusters;
  };

  // --- Map Rendering Logic (Using LayerGroup) ---
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !isMapReady || !layerGroupRef.current) return;
    
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    
    // Clear all existing layers safely
    layerGroup.clearLayers();

    if (viewMode === 'marker') {
      filteredCases.forEach(c => {
        const config = STATUS_GROUPS[c.statusGroup];
        const svgContent = getCategoryIconSVG(c.categories[0]);
        const isSelected = selectedCase?.id === c.id;

        // Custom Indicator Logic: Add ring and scale if selected
        const activeClass = isSelected 
            ? 'ring-4 ring-blue-500 ring-offset-2 scale-125 z-50' 
            : 'hover:scale-110';

        const icon = window.L.divIcon({
          className: 'custom-pin',
          html: `<div class="relative flex items-center justify-center w-full h-full transform transition-all duration-300 ${activeClass}">
            <div class="${config.color} w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>
            </div></div>`,
          iconSize: [32, 32], iconAnchor: [16, 30], popupAnchor: [0, -32]
        });
        
        // Set higher zIndexOffset for selected marker to keep it on top
        const marker = window.L.marker([c.lat, c.lng], { 
            icon,
            zIndexOffset: isSelected ? 1000 : 0 
        }).on('click', () => handleMarkerClick(c));
        
        layerGroup.addLayer(marker);
      });
    } else if (viewMode === 'heatmap') {
      filteredCases.forEach(c => {
        let densityCount = 0;
        const radius = 0.008; 
        filteredCases.forEach(other => {
             const dist = Math.sqrt(Math.pow(c.lat - other.lat, 2) + Math.pow(c.lng - other.lng, 2));
             if (dist < radius) densityCount++;
        });
        const density = Math.min(densityCount / 20, 1);
        const color = getHeatColor(density);
        // Using circleMarker within LayerGroup
        const circle = window.L.circleMarker([c.lat, c.lng], {
          radius: 12 + (density * 10), fillColor: color, color: color, weight: 0, opacity: 0, fillOpacity: 0.4
        });
        layerGroup.addLayer(circle);
      });
    } else if (viewMode === 'cluster') {
        const clusters = getZoomAwareClusters(filteredCases, map);
        
        clusters.forEach(cluster => {
            let size = 30; let className = 'bg-blue-500';
            if (cluster.count > 50) { size = 60; className = 'bg-red-600'; }
            else if (cluster.count > 20) { size = 50; className = 'bg-orange-500'; }
            else if (cluster.count > 5) { size = 40; className = 'bg-yellow-500'; }
            
            const icon = window.L.divIcon({
                className: 'custom-cluster',
                html: `<div class="${className} rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white bg-opacity-90 hover:scale-110 transition-transform" style="width:${size}px; height:${size}px; font-weight:bold; font-size:${size/2.5}px;">${cluster.count}</div>`,
                iconSize: [size, size], iconAnchor: [size/2, size/2]
            });
            const marker = window.L.marker([cluster.lat, cluster.lng], { icon }).on('click', () => {
                if (cluster.count === 1) handleMarkerClick(cluster.ids[0]);
                else map.setView([cluster.lat, cluster.lng], map.getZoom() + 2); // Zoom in on click
            });
            layerGroup.addLayer(marker);
        });
    }
  }, [filteredCases, viewMode, isMapReady, mapZoom, selectedCase]); 

  const initMap = () => {
    if (mapInstanceRef.current) return;
    const defaultZoom = window.innerWidth < 768 ? 11 : 12;
    const map = window.L.map('map', { zoomControl: false }).setView([13.7563, 100.5018], defaultZoom);
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    
    window.L.control.zoom({ position: 'topright' }).addTo(map);
    
    const layerGroup = window.L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    map.on('zoomend', () => {
        setMapZoom(map.getZoom());
    });

    mapInstanceRef.current = map;
    setIsMapReady(true);
  };

  const handleMarkerClick = (c) => {
    setSelectedCase(c);
    
    const map = mapInstanceRef.current;
    if (!map) return;

    let targetLat = c.lat;
    let targetLng = c.lng;
    const targetZoom = 16;

    const isMobileView = window.innerWidth < 768;

    if (isMobileView) {
        setIsSidebarOpen(false);
        const point = map.project([c.lat, c.lng], targetZoom);
        point.y += 180; 
        const newCenter = map.unproject(point, targetZoom);
        targetLat = newCenter.lat;
        targetLng = newCenter.lng;
    }

    map.flyTo([targetLat, targetLng], targetZoom, { animate: true });
  };

  const handleListClick = (c) => {
    handleMarkerClick(c);
  };

  // --- Handlers ---
  const toggleTempStatusId = (id) => {
    setTempStatusIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };
  const toggleTempStatusGroup = (groupKey) => {
    const groupIds = getIdsForGroup(groupKey);
    const allSelected = groupIds.every(id => tempStatusIds.includes(id));
    if (allSelected) setTempStatusIds(prev => prev.filter(id => !groupIds.includes(id)));
    else setTempStatusIds(prev => [...new Set([...prev, ...groupIds])]);
  };
  const toggleTempCategory = (cat) => {
    setTempCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  const toggleTempRating = (rating) => {
    setTempRating(prev => prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]);
  };
  const handleTempSelectAllCategories = () => {
    const visible = CATEGORIES.filter(c => c.includes(categorySearchTerm));
    const allSelected = visible.every(c => tempCategories.includes(c));
    if (allSelected) setTempCategories(prev => prev.filter(c => !visible.includes(c)));
    else setTempCategories(prev => [...new Set([...prev, ...visible])]);
  };
  const handleApplyFilters = () => {
    setAppliedFilters({
      searchTerm: tempSearchTerm,
      statusIds: tempStatusIds,
      categories: tempCategories,
      rating: tempRating
    });
    if (isMobile) setIsFiltersVisible(false);
  };
  const handleResetFilters = () => {
    setTempSearchTerm('');
    setTempStatusIds(getAllStatusIds());
    setTempCategories(CATEGORIES);
    setTempRating([1, 2, 3, 4, 5, 0]);
    setAppliedFilters({
      searchTerm: '',
      statusIds: getAllStatusIds(),
      categories: CATEGORIES,
      rating: [1, 2, 3, 4, 5, 0]
    });
  };

  const displayedCategories = CATEGORIES.filter(c => c.includes(categorySearchTerm));

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      {/* --- Header (Z-Index increased to 1100) --- */}
      <header className="bg-white shadow-md z-[1100] px-4 py-4 flex items-center justify-between border-b shrink-0 relative">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 md:hidden">
            <List size={24} />
          </button>
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
            <MapIcon size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-none">CitySense Dashboard</h1>
            <span className="text-xs md:text-sm text-gray-500 mt-1">สำนักการระบายน้ำ</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300"></div> 
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* --- Sidebar (Z-Index increased to 1000) --- */}
        <div 
            className={`
                flex flex-col h-full bg-white shadow-2xl z-[1000] transition-transform duration-300 w-full md:w-96 border-r
                absolute inset-y-0 left-0 md:relative 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
            `}
        >
          {/* 1. Sticky Header & Search */}
          <div className="p-4 border-b bg-white z-10 sticky top-0 shadow-sm space-y-3">
            
            <div className="flex justify-between items-center md:hidden mb-2">
                <h2 className="font-bold text-lg text-gray-800">ตัวกรอง & รายการ</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                    <X size={20} />
                </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={18} />
              <input 
                type="text" placeholder="ค้นหารหัส, ชื่อเรื่อง..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50 transition-all"
                value={tempSearchTerm} onChange={(e) => setTempSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              />
            </div>
            
            {/* Filter Toggle & Actions Row */}
            <div className="flex gap-2">
                <button 
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className={`flex-1 flex items-center justify-between px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${isFiltersVisible ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                    <div className="flex items-center gap-2">
                        <Filter size={16}/> 
                        <span>ตัวกรอง</span>
                    </div>
                    {isFiltersVisible ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
                <button onClick={handleResetFilters} className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors" title="รีเซ็ต">
                    <RotateCcw size={18}/>
                </button>
                <button 
                    onClick={handleApplyFilters} 
                    className={`
                        px-4 py-2 text-white rounded-lg shadow-md active:scale-95 transition-all font-bold flex items-center gap-1
                        ${isFilterDirty 
                            ? 'bg-orange-500 hover:bg-orange-600 ring-2 ring-orange-200 animate-pulse' // Dirty State
                            : 'bg-blue-600 hover:bg-blue-700'
                        }
                    `}
                >
                    <Search size={16}/> {isFilterDirty ? 'ยืนยัน' : 'ค้นหา'}
                </button>
            </div>
          </div>

          {/* 2. Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            
            {/* --- Filters Panel (Collapsible) --- */}
            <div className={`border-b bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out ${isFiltersVisible ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}>
               <div className="px-4 space-y-5">
                   {/* Status Filter */}
                   <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">สถานะ</label>
                     <div className="grid grid-cols-1 gap-2">
                        {Object.entries(STATUS_GROUPS).map(([key, config]) => {
                          const groupIds = getIdsForGroup(key);
                          const isFullSelected = groupIds.every(id => tempStatusIds.includes(id));
                          const isPartialSelected = groupIds.some(id => tempStatusIds.includes(id)) && !isFullSelected;
                          const subStatuses = USER_DEFINED_STATUSES.filter(s => s.group === key);
                          const hasSubStatuses = subStatuses.length > 0;
                          const isExpanded = expandedStatusGroup === key;

                          return (
                            <div key={key} className="relative">
                                <div className="flex gap-1">
                                    <button
                                    onClick={() => toggleTempStatusGroup(key)}
                                    className={`relative flex-1 flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${(isFullSelected || isPartialSelected) ? 'bg-white border-blue-500 shadow-sm' : 'bg-white border-transparent hover:bg-gray-100'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${config.color} shrink-0`} />
                                        <span className={`flex-1 font-medium text-sm ${(isFullSelected || isPartialSelected) ? 'text-gray-800' : 'text-gray-500'}`}>{config.label}</span>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${(isFullSelected || isPartialSelected) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-gray-50'}`}>
                                            {isFullSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                            {isPartialSelected && <div className="w-2 h-0.5 bg-white"></div>}
                                        </div>
                                    </button>
                                    {hasSubStatuses && (
                                        <button onClick={() => setExpandedStatusGroup(isExpanded ? null : key)} className={`px-2 rounded-lg border border-transparent hover:bg-gray-200 text-gray-400 ${(isExpanded) ? 'bg-gray-200 text-gray-600' : ''}`}>
                                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                        </button>
                                    )}
                                </div>
                                {isExpanded && (
                                    <div className="mt-2 ml-4 pl-3 border-l-2 border-gray-200 space-y-1 animate-in slide-in-from-top-1 fade-in duration-200">
                                        {subStatuses.map(sub => {
                                            const isSubSelected = tempStatusIds.includes(sub.id);
                                            return (
                                                <label key={sub.id} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 text-sm">
                                                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={isSubSelected} onChange={() => toggleTempStatusId(sub.id)} />
                                                    <span className={isSubSelected ? 'text-gray-700 font-medium' : 'text-gray-500'}>{sub.label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                          );
                        })}
                     </div>
                   </div>

                   {/* Category Filter */}
                   <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}>
                        <label className="text-sm font-bold text-gray-700 cursor-pointer">ประเภท ({tempCategories.length})</label>
                        {isCategoryExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </div>
                      {isCategoryExpanded && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <input type="text" placeholder="กรองประเภท..." className="w-full px-3 py-1.5 text-xs border rounded-lg bg-gray-50" value={categorySearchTerm} onChange={(e) => setCategorySearchTerm(e.target.value)} />
                          <button onClick={handleTempSelectAllCategories} className="text-xs text-blue-600 font-medium hover:underline">เลือก/ยกเลิก ทั้งหมด</button>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                              {displayedCategories.map(cat => (
                                  <label key={cat} className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={tempCategories.includes(cat)} onChange={() => toggleTempCategory(cat)} />
                                      <span className="text-gray-700">{cat}</span>
                                  </label>
                              ))}
                          </div>
                        </div>
                      )}
                   </div>

                   {/* Rating Filter (Multiple Select Buttons) */}
                   <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">ความพึงพอใจ</label>
                     <div className="grid grid-cols-3 gap-2">
                        {/* Star Options */}
                        {[5, 4, 3, 2, 1].map(star => {
                           const isSelected = tempRating.includes(star);
                           return (
                             <button 
                               key={star} 
                               onClick={() => toggleTempRating(star)} 
                               className={`
                                 py-2 rounded-lg border flex flex-col justify-center items-center transition-all
                                 ${isSelected 
                                    ? 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-200 shadow-sm' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                 }
                               `}
                             >
                               <div className="flex items-center gap-1">
                                   <span className={`text-xs font-bold ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>{star}</span>
                                   <Star size={12} className={isSelected ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}/>
                               </div>
                             </button>
                           );
                        })}
                        
                        {/* N/A Option */}
                        <button 
                            onClick={() => toggleTempRating(0)}
                            className={`
                                py-2 rounded-lg border flex flex-col justify-center items-center transition-all
                                ${tempRating.includes(0) 
                                    ? 'bg-gray-100 border-gray-400 text-gray-800 ring-1 ring-gray-200 shadow-sm' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                }
                            `}
                        >
                            <span className="text-[10px] font-bold">N/A</span>
                            <span className="text-[9px]">ไม่มีประเมิน</span>
                        </button>
                     </div>
                   </div>
               </div>
            </div>

            {/* --- List Section Header (Result Count) --- */}
            <div className="px-4 py-3 bg-gray-100 border-b flex justify-between items-center sticky top-0 z-0">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">รายการแจ้งเหตุ</span>
                 <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border text-blue-600 font-bold shadow-sm">{filteredCases.length}</span>
            </div>

            {/* --- List Items --- */}
            <div className="p-4 space-y-4 bg-gray-100 min-h-[300px]">
              {filteredCases.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-3">
                   <div className="bg-white p-4 rounded-full shadow-sm"><Search size={32} className="text-gray-300"/></div>
                   <span className="text-sm">ไม่พบข้อมูล ลองปรับตัวกรองใหม่</span>
                 </div>
              ) : (
                filteredCases.map(c => (
                  <div key={c.id} onClick={() => handleListClick(c)} className={`group bg-white rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col ${selectedCase?.id === c.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}>
                    <div className="h-32 w-full relative overflow-hidden bg-gray-100">
                       <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                       <div className="absolute top-2 right-2">
                         <span className={`px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-md ${STATUS_GROUPS[c.statusGroup].color}`}>
                          {STATUS_GROUPS[c.statusGroup].label}
                         </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{c.title}</h3>
                         <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 rounded border">{c.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-2 font-medium">
                         {c.status === 'budget' && <Coins size={12}/>}
                         {c.status === 'procurement' && <FileText size={12}/>}
                         {c.statusLabel}
                      </div>
                      <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
                         <Layers size={12} className="text-gray-400" /> <span className="line-clamp-1">{c.categories.join(', ')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400">{c.timestamp}</span>
                        <StarRating rating={c.rating} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- Toggle Sidebar Button (OUTSIDE SIDEBAR) --- */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className={`
            hidden md:flex 
            absolute top-1/2 z-[1001] transition-all duration-300
            bg-white shadow-md border border-l-0 p-1 rounded-r-lg hover:bg-gray-50 w-8 h-12 items-center justify-center
          `}
          style={{ 
              left: isSidebarOpen && !isMobile ? '24rem' : '0', // 24rem = w-96
          }}
        >
           {isSidebarOpen ? <ChevronRight className="rotate-180 text-gray-600" size={20}/> : <ChevronRight size={20} className="text-gray-600"/>}
        </button>


        {/* --- Map Container & Popup --- */}
        <div className="flex-1 relative h-full w-full bg-gray-100 z-0">
           <div id="map" className="w-full h-full z-0 outline-none"></div>

           <div className="absolute top-20 right-4 z-[400] bg-white rounded-lg shadow-xl border border-gray-100 p-1.5 flex flex-col gap-1">
              <button onClick={() => setViewMode('marker')} className={`p-2.5 rounded-md transition-colors ${viewMode === 'marker' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`} title="Marker"><MapIcon size={20} /></button>
              <button onClick={() => setViewMode('cluster')} className={`p-2.5 rounded-md transition-colors ${viewMode === 'cluster' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`} title="Cluster"><Layers size={20} /></button>
              <button onClick={() => setViewMode('heatmap')} className={`p-2.5 rounded-md transition-colors ${viewMode === 'heatmap' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`} title="Heatmap"><Crosshair size={20} /></button>
           </div>

           {selectedCase && (
             <div className="absolute bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:w-[26rem] bg-white md:rounded-2xl shadow-2xl z-[500] border-t md:border animate-in slide-in-from-bottom-10 md:fade-in max-h-[70vh] overflow-y-auto flex flex-col">
                <div className="relative h-48 shrink-0">
                  <img src={selectedCase.image} className="w-full h-full object-cover" alt="Case" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <button onClick={() => setSelectedCase(null)} className="absolute top-3 right-3 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 backdrop-blur-sm transition-colors"><X size={20} /></button>
                  <div className="absolute bottom-4 left-5 right-5">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-white mb-2 shadow-sm ${STATUS_GROUPS[selectedCase.statusGroup].color}`}>
                        {STATUS_GROUPS[selectedCase.statusGroup].label}
                      </div>
                      <h3 className="font-bold text-white text-xl leading-tight shadow-sm">{selectedCase.title}</h3>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                         <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">รหัสแจ้งเหตุ</span>
                         <span className="font-mono font-medium text-base text-gray-800">{selectedCase.id}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                         <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">สถานะปัจจุบัน</span>
                         <span className="font-medium truncate text-base text-blue-600 flex items-center gap-1">
                            {selectedCase.status === 'budget' && <Coins size={14}/>}
                            {selectedCase.status === 'procurement' && <FileText size={14}/>}
                            {selectedCase.statusLabel}
                         </span>
                      </div>
                   </div>
                   <div className="text-sm md:text-base text-gray-600 leading-relaxed">{selectedCase.description}</div>
                   <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shadow-inner border border-blue-200">{selectedCase.reporter.charAt(0)}</div>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-800">{selectedCase.reporter}</span>
                            <span className="text-xs text-gray-500">{selectedCase.timestamp}</span>
                         </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <StarRating rating={selectedCase.rating} />
                         <span className="text-[10px] text-gray-400 mt-1">ระดับความพึงพอใจ</span>
                      </div>
                   </div>
                   <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 text-sm md:text-base">
                      <Info size={18} /> ดำเนินการ / ดูประวัติแก้ไข
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}