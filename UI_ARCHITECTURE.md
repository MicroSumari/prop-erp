# UI Layout Architecture

## Before (Top Navigation Bar)
```
┌────────────────────────────────────────────────────────────────────────┐
│ 🏢 Property ERP   [Dashboard] [Properties] [Property Units] [Tenants]   │
│                   [Rent Collection] [Maintenance] [Expenses] [User] [X] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                          MAIN CONTENT AREA                              │
│                                                                          │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

**Issues:** 
- Crowded header with many navigation links
- Limited horizontal space for content
- Navigation takes up valuable real estate

---

## After (Sidebar + Header)

### Desktop View (1200px+)
```
┌────────┬──────────────────────────────────────────────────────┐
│ 🏢 ERP  | User Info  [Logout]                                  │
├────────┴──────────────────────────────────────────────────────┤
│        │                                                        │
│  📊    │                                                        │
│  📦 ▼  │          MAIN CONTENT AREA                            │
│   ├ 📄 │                                                        │
│   ├ 📦 │                                                        │
│   └ 👤 │                                                        │
│  💰    │                                                        │
│  🔧    │                                                        │
│  📋    │                                                        │
│        │                                                        │
└────────┴──────────────────────────────────────────────────────┘
260px     Remaining Space
```

**Benefits:**
- Clean, minimal header focused on branding & user actions
- Organized sidebar with collapsible sections
- More horizontal space for main content
- Modern and professional appearance

---

### Mobile View (<768px)
```
┌───┬──────────────────────────────────┐
│ ☰ │ 🏢 Property ERP      [User] [X]  │
├───┴──────────────────────────────────┤
│                                       │
│          MAIN CONTENT AREA            │
│          (Full Width)                 │
│                                       │
│                                       │
└───────────────────────────────────────┘

When ☰ clicked (Hamburger Menu):
┌────────────────────┬─────────────────┐
│ ✕ Menu             │  MAIN CONTENT   │
│ ─────────────────  │  (Dimmed)       │
│ 📊 Dashboard       │                 │
│ 📦 Properties ▼    │                 │
│   ├ Properties     │                 │
│   ├ Property Units │                 │
│   └ Related Parties│                 │
│ 💰 Rent Collection │                 │
│ 🔧 Maintenance     │                 │
│ 📋 Expenses        │                 │
│                    │                 │
└────────────────────┴─────────────────┘
```

**Mobile Features:**
- Hamburger menu toggle (☰) in header
- Offcanvas sidebar drawer slides in from left
- Semi-transparent backdrop dims main content
- Click anywhere outside to close sidebar
- Auto-close sidebar when link clicked

---

## Component Hierarchy

```
App.js
├── Navigation.js
│   ├── Logo
│   ├── Hamburger Toggle (mobile only)
│   ├── User Info
│   └── Logout Button
│
├── Sidebar.js
│   ├── Desktop Sidebar (fixed, visible on lg+)
│   │   └── Menu Items
│   │       ├── Dashboard (link)
│   │       ├── Properties (collapsible)
│   │       │   ├── Properties (link)
│   │       │   ├── Property Units (link)
│   │       │   └── Related Parties (link)
│   │       ├── Rent Collection (link)
│   │       ├── Maintenance (link)
│   │       └── Expenses (link)
│   │
│   └── Mobile Offcanvas (hidden on xs-md)
│       └── [Same Menu Items as Desktop]
│
└── Main Content Area
    └── Routes
        ├── Dashboard
        ├── PropertyList, PropertyForm
        ├── PropertyUnitList, PropertyUnitForm
        ├── TenantList, TenantForm
        ├── MaintenanceList
        ├── ExpenseList
        └── RentCollection
```

---

## State Management

### Sidebar Visibility State (Mobile)
```javascript
const [sidebarShow, setSidebarShow] = useState(false);

// Toggle sidebar
<Navigation onSidebarToggle={() => setSidebarShow(!sidebarShow)} />

// Pass to sidebar
<Sidebar show={sidebarShow} handleClose={() => setSidebarShow(false)} />
```

### Expanded Sections State
```javascript
const [expandedSections, setExpandedSections] = useState({
  properties: true,  // Properties section starts expanded
});

// Toggle section
const toggleSection = (section) => {
  setExpandedSections(prev => ({
    ...prev,
    [section]: !prev[section],
  }));
};
```

---

## Routing Structure

All routes remain unchanged:
```
/                          → Dashboard
/properties                → Property List
/properties/new            → Create Property Form
/properties/edit/:id       → Edit Property Form
/property-units            → Property Units List
/property-units/new        → Create Unit Form
/property-units/edit/:id   → Edit Unit Form
/tenants                   → Related Parties (Tenant List)
/tenants/new               → Create Related Party Form
/tenants/edit/:id          → Edit Related Party Form
/rent-collection           → Rent Collection
/maintenance               → Maintenance
/expenses                  → Expenses
```

---

## CSS Breakpoints

| Device          | Width    | Sidebar State     | Width  |
|-----------------|----------|-------------------|--------|
| Extra Small (xs)| < 576px  | Hidden (offcanvas)| N/A    |
| Small (sm)      | ≥ 576px  | Hidden (offcanvas)| N/A    |
| Medium (md)     | ≥ 768px  | Hidden (offcanvas)| N/A    |
| Large (lg)      | ≥ 992px  | Visible (fixed)   | 260px  |
| X-Large (xl)    | ≥ 1200px | Visible (fixed)   | 260px  |
| XX-Large (xxl)  | ≥ 1400px | Visible (fixed)   | 260px  |

---

## Color Theme

### Sidebar Colors
```
┌─────────────────────────────────────┐
│ Background:  #2c3e50 (Dark Slate)   │
│ Accent:      #34495e (Lighter Slate)│
│ Active:      #3498db (Blue)         │
│ Text:        #ecf0f1 (Light Gray)   │
│ Hover:       Background changes     │
│              to #34495e + blue icon │
└─────────────────────────────────────┘
```

### Main Content
```
Background: #f8f9fa (Off White)
Contrast with sidebar for clear visual separation
```

---

## Interaction Patterns

### Desktop Sidebar
1. **Hover:** Menu item background lightens to #34495e
2. **Click Link:** Navigate to page, highlight active link in blue
3. **Click Collapsible:** Expand/collapse subsections
4. **Scroll:** Scrollbar appears for long menu lists

### Mobile Sidebar
1. **Tap Hamburger:** Offcanvas drawer slides in from left
2. **Tap Link:** Navigate to page AND close sidebar automatically
3. **Tap Outside:** Sidebar closes with backdrop click
4. **Swipe Left:** Sidebar closes (native offcanvas behavior)

---

## Accessibility Features

✅ Semantic HTML structure
✅ ARIA labels for interactive elements
✅ Keyboard navigation support (Tab, Enter, Escape)
✅ Focus states for keyboard users
✅ Color contrast ratios meet WCAG AA standards
✅ Offcanvas dialog with proper focus management
✅ Icon usage with proper text labels

---

## Performance

- **CSS:** 34.86 kB (gzipped)
- **JS:** 96.83 kB (gzipped)
- **No additional npm packages required** (uses React Bootstrap)
- **Sidebar animations:** GPU-accelerated transitions
- **Mobile offcanvas:** Native Bootstrap component for optimal performance

---

## Future Enhancement Ideas

1. **Sidebar Persistence:** Save expanded/collapsed state to localStorage
2. **User Preferences:** Allow users to set sidebar width or theme
3. **Breadcrumb Navigation:** Add breadcrumbs in main content header
4. **Search:** Add search functionality in sidebar header
5. **Notifications:** Add notification badge to sidebar items
6. **Favorites:** Allow pinning frequently used menu items to top
7. **Avatar:** Add user profile picture to sidebar header
8. **Dark Mode:** Add toggle for dark/light theme in sidebar
