# Heat Exchanger Lab | Parallel & Counter Flow

> **Interactive Virtual Laboratory for Thermal Engineering Education**

A responsive, dependency-free web application for parallel-flow and counter-flow heat exchanger experiments. Designed for students at the College of Engineering & Technology to conduct virtual laboratory experiments with real-time calculations and comprehensive assessment tools.

![University of Technology and Applied Sciences, Nizwa](assets/utas-nizwa.jpeg)

## 🎯 Overview

This application provides an interactive learning environment for studying heat exchanger effectiveness. Students can:
- Configure parallel or counter-flow arrangements
- Record temperature measurements from apparatus simulations
- Calculate heat transfer, LMTD, and overall coefficient in real-time
- Generate professional laboratory reports
- Complete comprehensive assessment quizzes
- Track class performance through the built-in grade register

## 🚀 Quick Start

### Option 1: Direct File Access
Open `index.html` directly in your web browser.

### Option 2: Local Server (Recommended)
For optimal browser behavior and local storage functionality:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Included features

- Parallel/counter flow tabbed apparatus views
- Editable five-run observation table
- Automatic heat transfer, LMTD, overall coefficient and effectiveness calculations
- Arrangement-specific LMTD logic
- CSV export and print-ready report layout
- Responsive desktop, tablet and mobile UI
- Semantic HTML and accessible controls
- Complete 120-question viva bank for parallel and counter flow
- Four random questions per student with automatic four-mark report
- Local class mark register for up to 30 students with CSV export
- University branding and live T1, T2, t1 and t2 apparatus readings

## Calculation assumptions

- Water specific heat: 4187 J/kg.K
- Each collection-time reading is for one litre of water
- Outer diameter of inner tube: 0.0125 m
- Heat exchanger length: 1.5 m
- Heat-transfer area: `A = pi D L`

The included values are demonstration readings. Replace them with measured laboratory values before preparing a formal report.

Quiz results are stored in the current browser. For a shared laboratory deployment where students use different devices and results must appear in one central register, connect the interface to a server-side database.
