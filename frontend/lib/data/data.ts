// Central source of truth for all NexLapTech business content.
// Keeping this separate from components makes copy edits a one-file change.

export const business = {
  name: "NEXLAPTECH",
  tagline: "Laptops • Components • Accessories",
  description:
    "NexLapTech is your trusted destination for laptops, computer components, and accessories at the best prices with genuine warranty and reliable support.",
  phones: ["+91 8088979706", "+91 8904760125"],
  phoneLinks: ["+918088979706", "+918904760125"],
  email: "nexbytetechnologies@gmail.com",
  instagram: "https://instagram.com/nexbytetechnologies",
  instagramHandle: "@nexbytetechnologies",
  whatsappChannel: "https://whatsapp.com/channel/0029Vb5jdLWL7UVVMBX23s2d",
  serviceAreas: ["Bengaluru", "Tumkur", "Hiriyur (Coming Soon)"],
  address: {
    line1: "Service Areas: Bengaluru | Tumkur | Hiriyur — Coming Soon",
    line2: "Doorstep & On-Site Support",
    city: "Karnataka, India",
    mapsQuery: "NEXLAPTECH+Karnataka",
  },
  branches: [
    { name: "Bengaluru Service Area", location: "Bengaluru & Surrounding Regions", status: "active" },
    { name: "Tumkur Branch", location: "Upparahalli, Tumkur - 572101", status: "active" },
    { name: "Hiriyur Branch", location: "Hiriyur, Karnataka (Coming Soon)", status: "opening-soon" },
  ],
  hours: [
    { day: "Monday – Saturday", time: "9:30 AM – 8:30 PM" },
    { day: "Sunday", time: "10:00 AM – 5:00 PM" },
  ],
} as const;

export const HARDWARE_CATEGORIES = [
  { id: "storage", name: "Storage (SSD / HDD / Enclosures)", icon: "HardDrive" },
  { id: "ram", name: "RAM / Memory (DDR3 / DDR4 / DDR5)", icon: "Cpu" },
  { id: "laptop_components", name: "Laptop Components & Parts", icon: "Laptop" },
  { id: "desktop_components", name: "Desktop Components & PC Parts", icon: "Monitor" },
  { id: "peripherals", name: "Keyboard / Mouse / Peripherals", icon: "Keyboard" },
  { id: "usb_typec", name: "USB & Type-C Accessories", icon: "Usb" },
  { id: "display_video", name: "Display & Video Adapters/Cables", icon: "Tv" },
  { id: "networking", name: "Networking & WiFi Devices", icon: "Wifi" },
  { id: "repair_tools", name: "Laptop / PC Repair Tools", icon: "Wrench" },
  { id: "thermal_cooling", name: "Thermal Paste & Cooling Solutions", icon: "Thermometer" },
  { id: "laptop_cleaning", name: "Laptop Cleaning & Maintenance", icon: "Sparkles" },
  { id: "power", name: "Power Adapters & SMPS Supplies", icon: "Zap" },
  { id: "memory_cards", name: "Memory Cards & Readers", icon: "SdCard" },
  { id: "audio", name: "Audio Accessories & Microphones", icon: "Headphones" },
  { id: "cctv_security", name: "CCTV & Security Accessories", icon: "ShieldCheck" },
  { id: "small_components", name: "Small Repair Components & Connectors", icon: "Layers" },

  // System Categories
  { id: "gaming_pcs", name: "Gaming PCs & Workstations", icon: "Gamepad2" },
  { id: "business_laptops", name: "Business Laptops", icon: "Laptop" },
  { id: "premium_used_laptops", name: "Premium Used Laptops", icon: "Laptop" },
  { id: "second_hand_laptops", name: "Refurbished Laptops", icon: "Laptop" },
  { id: "servers", name: "Servers & Enterprise Rack Systems", icon: "Server" },
  { id: "desktop_systems", name: "Desktop Workstation Systems", icon: "Monitor" },
  { id: "monitors", name: "Monitors & Displays", icon: "Tv" },
  { id: "cctv", name: "Complete CCTV Systems", icon: "ShieldCheck" }
] as const;

export const POPULAR_BRANDS = [
  "Kingston", "Crucial", "Samsung", "ADATA", "TeamGroup", "Corsair", "G.Skill",
  "Logitech", "Dell", "Lenovo", "HP", "Acer", "ASUS", "MSI", "Gigabyte",
  "TP-Link", "D-Link", "Western Digital", "Seagate", "Thermal Grizzly", "DeepCool", "Antec"
] as const;

export type ProductImage = {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  alt_text?: string;
};

export type ProductCompatibility = {
  brand?: string;
  series?: string;
  model?: string;
  partNumber?: string;
};

export type ProductVariant = {
  id: string;
  sku?: string;
  name: string; // e.g. "256GB NVMe SSD", "512GB NVMe SSD", "1TB NVMe SSD", "2TB NVMe SSD"
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock?: number;
  image?: string;
  attributes?: Record<string, string>;
  active?: boolean;
};

export type Product = {
  id: string;
  sku?: string;
  slug?: string;
  title: string;
  description: string;
  shortDescription?: string;
  image: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tags: string[];
  category: string;
  subcategoryId?: string;
  brand?: string;

  price: number;
  compareAtPrice?: number;
  costPrice?: number; // ADMIN ONLY — Never exposed to customer API!

  stock?: number;
  lowStockThreshold?: number;

  specs: {
    [key: string]: string;
  };
  compatibility?: ProductCompatibility;

  discount?: number;

  warrantyEnabled?: boolean;
  warrantyDuration?: string;
  warranty?: string;
  warrantyText?: string;

  returnEnabled?: boolean;
  returnWindowDays?: number;
  returnPolicyText?: string;

  deliveryEnabled?: boolean;
  deliveryEstimate?: string;
  deliveryMinDays?: number;
  deliveryMaxDays?: number;

  offersEnabled?: boolean;
  activeOfferId?: string;

  status?: string; // "show" | "hide" | "deleted" | "pending"
  approval_status?: string; // "approved" | "pending" | "rejected"
  condition?: string;
  featured?: boolean;
  latest?: boolean;

  rating?: number;
  reviewCount?: number;

  seller_id?: string;
  seller_type?: string;
  created_by?: string;

  createdAt?: string;
  updatedAt?: string;
};

export const products: Product[] = [
  {
    id: "samsung-980-pro-ssd",
    sku: "SAM-SSD-980P",
    title: "Samsung 980 PRO PCIe 4.0 NVMe M.2 SSD",
    description: "Next-gen flagship PCIe 4.0 high-speed NVMe SSD for high-performance computing, workstation, and gaming storage upgrades.",
    image: "/images/poster-products.webp",
    category: "storage",
    brand: "Samsung",
    price: 15000,
    compareAtPrice: 18500,
    stock: 25,
    lowStockThreshold: 5,
    warrantyEnabled: true,
    warrantyDuration: "5 Years",
    warrantyText: "5 Years Samsung Official Brand Warranty",
    returnEnabled: true,
    returnWindowDays: 7,
    returnPolicyText: "7-Day Replacement Guarantee",
    deliveryEnabled: true,
    deliveryEstimate: "2–3 business days",
    deliveryMinDays: 2,
    deliveryMaxDays: 3,
    tags: ["Samsung", "NVMe SSD", "PCIe 4.0", "M.2 2280"],
    variants: [
      { id: "var-256", sku: "SAM-980P-256G", name: "256GB", price: 10000, compareAtPrice: 12500, stock: 12 },
      { id: "var-512", sku: "SAM-980P-512G", name: "512GB", price: 15000, compareAtPrice: 18500, stock: 25 },
      { id: "var-1tb", sku: "SAM-980P-1TB", name: "1TB", price: 20000, compareAtPrice: 24000, stock: 18 },
      { id: "var-2tb", sku: "SAM-980P-2TB", name: "2TB", price: 35000, compareAtPrice: 42000, stock: 8 }
    ],
    specs: {
      Interface: "PCIe Gen 4.0 x4, NVMe 1.3",
      FormFactor: "M.2 (2280)",
      ReadSpeed: "Up to 7,000 MB/s",
      WriteSpeed: "Up to 5,100 MB/s",
      Controller: "Samsung In-House Elpis Controller",
    }
  },
  {
    id: "gaming-pc-pro",
    title: "NexLapTech ROG Slayer R15 Gaming PC",
    description: "High-refresh, RGB-tuned gaming rig built around Nvidia RTX 4070 and Intel i7 14th Gen for zero-compromise frame rates.",
    image: "/images/product-gaming-desktops.png",
    tags: ["Custom Build", "RTX 4070", "Intel i7"],
    category: "gaming_pcs",
    price: 135000,
    specs: {
      Processor: "Intel Core i7-14700K (Up to 5.6GHz)",
      RAM: "32GB Corsair Vengeance DDR5 6000MHz",
      GPU: "Nvidia GeForce RTX 4070 12GB GDDR6X",
      Storage: "2TB Kingston Renegade M.2 PCIe Gen4 NVMe SSD",
      Motherboard: "ASUS ROG Strix Z790-F Gaming WiFi",
      Cooling: "DeepCool LS720 360mm Liquid AIO",
      Power: "Corsair RM850e 850W 80+ Gold Modular",
      Condition: "Brand New (3 Years Warranty)",
    },
  },
  {
    id: "premium-used-macbook",
    title: "MacBook Pro 16\" M1 Pro (Certified Pre-Owned)",
    description: "Rigorously tested, certified premium developer notebook with high battery health and original box.",
    image: "/images/product-second-hand-laptops.png",
    tags: ["M1 Pro", "16-inch", "16GB RAM"],
    category: "premium_used_laptops",
    price: 125000,
    specs: {
      Processor: "Apple M1 Pro (10-Core CPU, 16-Core GPU)",
      RAM: "16GB Unified Memory",
      Display: "16.2-inch Liquid Retina XDR (3024 x 1964, 120Hz)",
      Storage: "512GB High-Speed Apple SSD",
      OS: "macOS Sonoma",
      Battery: "92% Health (Original Charger)",
      Condition: "Excellent (Grade A, 6 Months NexLapTech Warranty)",
    },
  },
  {
    id: "thinkpad-refurbished",
    title: "Lenovo ThinkPad T490 (Certified Refurbished)",
    description: "Rigorously tested, enterprise-grade business laptop with military-grade durability, perfect for students.",
    image: "/images/product-second-hand-laptops.png",
    tags: ["ThinkPad", "Intel i5", "8GB RAM"],
    category: "second_hand_laptops",
    price: 285000,
    specs: {
      Processor: "Intel Core i5-8365U (Up to 4.1GHz)",
      RAM: "8GB DDR4 (Expandable)",
      Display: "14-inch Full HD IPS (1920 x 1080) Anti-glare",
      Storage: "256GB PCIe NVMe M.2 SSD",
      OS: "Windows 11 Professional Genuine",
      Battery: "85% Health (Type-C Charger)",
      Condition: "Very Good (Grade B+, 6 Months NexLapTech Warranty)",
    },
  },
  {
    id: "business-laptop-dell",
    title: "Dell Latitude 5440 Pro Laptop",
    description: "Reliable, enterprise-ready professional business laptop engineered for secure, all-day battery performance.",
    image: "/images/product-business-laptops.png",
    tags: ["Dell Latitude", "Intel i5 13th Gen", "16GB RAM"],
    category: "business_laptops",
    price: 78000,
    specs: {
      Processor: "Intel Core i5-1335U (13th Gen, Up to 4.6GHz)",
      RAM: "16GB DDR5 4800MHz Dual Channel",
      Display: "14.0-inch FHD (1920x1080) ComfortView",
      Storage: "512GB M.2 PCIe Gen4 NVMe SSD",
      OS: "Windows 11 Pro License Key",
      Battery: "54Whr (ExpressCharge Capable)",
      Condition: "Brand New (3 Years Dell On-Site Warranty)",
    },
  },
  {
    id: "server-rack-xeon",
    title: "NexLapTech Xeon Enterprise Rack Server 1U",
    description: "High-density compute infrastructure for offices, virtualization, databases, and heavy processing networks.",
    image: "/images/product-bulk-laptop-supply.png",
    tags: ["Xeon Silver", "Dual CPU", "64GB ECC"],
    category: "servers",
    price: 245000,
    specs: {
      Processor: "Dual Intel Xeon Silver 4314 (32 Cores Total)",
      RAM: "64GB DDR4 ECC Registered RDIMM",
      Storage: "4x 2.4TB SAS 12G Enterprise 10K HDDs (RAID 10)",
      Controller: "Broadcom MegaRAID SAS 9361-8i 2GB",
      NIC: "Quad 1GbE Base-T LAN + Dual 10GbE SFP+",
      Power: "Redundant 750W Hot-plug PSU (1+1)",
      Condition: "Brand New (3 Years Server Warranty)",
    },
  },
  {
    id: "desktop-office-workstation",
    title: "NexLapTech Office Workstation Intel i5",
    description: "Standardised, highly reliable corporate desktops for offices, schools, billing centers, and call units.",
    image: "/images/product-bulk-desktop-supply.png",
    tags: ["Intel i5", "Micro ATX", "Office Pack"],
    category: "desktop_systems",
    price: 34000,
    specs: {
      Processor: "Intel Core i5-12400 (Up to 4.4GHz)",
      RAM: "8GB Kingston Fury DDR4 3200MHz",
      Motherboard: "MSI PRO H610M-E Motherboard",
      Storage: "512GB Crucial P3 NVMe M.2 SSD",
      OS: "Windows 11 Home & Office Student 2021",
      Cabinet: "NexLapTech Business Micro-ATX Cabinet with 450W PSU",
      Condition: "Brand New (2 Years Component Warranty)",
    },
  },
  {
    id: "accessories-keyboard-mouse",
    title: "NexLapTech Mechanical Gaming Combo RGB",
    description: "Anti-ghosting key layout mechanical switch keyboard paired with high-DPI ergonomic RGB gaming mouse.",
    image: "/images/product-computer-accessories.png",
    tags: ["Blue Switches", "RGB", "USB Wired"],
    category: "accessories",
    price: 3500,
    specs: {
      Keyboard: "Outemu Blue Clicky Mechanical Switches",
      Mouse: "PMW3325 Sensor, Up to 10000 DPI Custom Adjustable",
      Lighting: "18 Pre-set RGB Modes with Software Configuration",
      Connectivity: "Double Shielded 1.8m Braided USB Cable",
      Compatibility: "Windows 10/11, macOS, Linux",
      Condition: "Brand New (1 Year Replacement Warranty)",
    },
  },
  {
    id: "storage-nvme-ssd",
    title: "NexLapTech Black NVMe M.2 1TB SSD Upgrade Kit",
    description: "Blazing fast PCIe Gen 4 SSD with read speeds up to 7000MB/s, compatible with desktop and laptops.",
    image: "/images/product-custom-pc-assembly.png",
    tags: ["SSD Upgrade", "PCIe Gen 4", "7000MB/s"],
    category: "storage",
    price: 6800,
    specs: {
      Capacity: "1TB (1000GB) Form Factor M.2 2280",
      Interface: "PCIe Gen 4.0 x4, NVMe 1.4 Protocol",
      Speed: "Read up to 7300MB/s, Write up to 6000MB/s",
      Controller: "Phison PS5018-E18 with DRAM Cache",
      Warranty: "5 Years Limited Manufacturer Warranty",
      Condition: "Brand New",
    },
  },
  {
    id: "networking-gigabit-router",
    title: "NexLapTech AX3000 WiFi 6 Dual-Band Router",
    description: "Seamless wireless coverage and ultra-low latency Gigabit speeds for smart homes and offices.",
    image: "/images/product-cctv-systems.png",
    tags: ["WiFi 6", "AX3000", "Dual Band"],
    category: "networking",
    price: 4900,
    specs: {
      Standard: "WiFi 6 (802.11ax), Dual-Band 2.4GHz & 5GHz",
      Speed: "Up to 2402 Mbps on 5GHz + 574 Mbps on 2.4GHz",
      Antennas: "4x External Multi-directional High-Gain Antennas",
      Ports: "1x Gigabit WAN Port + 3x Gigabit LAN Ports",
      Security: "WPA3 Wireless Encryption, Guest Portal",
      Condition: "Brand New (3 Years Warranty)",
    },
  },
  {
    id: "monitor-ips-gaming",
    title: "NexLapTech 27\" IPS 165Hz QHD Gaming Monitor",
    description: "Premium display featuring 99% sRGB color accuracy, 1ms response time, and AMD FreeSync support.",
    image: "/images/product-gaming-desktops.png",
    tags: ["2K QHD", "IPS Panel", "165Hz"],
    category: "monitors",
    price: 21500,
    specs: {
      Panel: "27-inch IPS (In-Plane Switching) Display",
      Resolution: "2560 x 1440 (Quad HD, 2K Aspect Ratio 16:9)",
      RefreshRate: "165Hz (Overclockable to 170Hz via DP)",
      ResponseTime: "1ms GtG (Gray-to-Gray) with Overdrive",
      Ports: "2x HDMI 2.0 + 1x DisplayPort 1.4 + Audio Out",
      Features: "HDR10, Low Blue Light Flicker-Free, Height Adjustable",
      Condition: "Brand New (3 Years Panel Warranty)",
    },
  },
  {
    id: "cctv-outdoor-camera",
    title: "NexLapTech Smart Outdoor CCTV Camera Dome Kit",
    description: "Complete 4-Camera HD 4MP color night-vision setup with 1TB surveillance HDD and remote phone viewing app.",
    image: "/images/product-cctv-systems.png",
    tags: ["4MP HD", "Color Night Vision", "Remote App"],
    category: "cctv",
    price: 18500,
    specs: {
      Resolution: "4 Megapixel Full HD Color Stream (2560x1440)",
      Cameras: "4x IP67 Weatherproof Dome Cameras (PoE)",
      NVR: "8-Channel Network Video Recorder with 1TB HDD",
      NightVision: "Smart IR up to 30 Meters Full Color Mode",
      MobileApp: "NexSecure Mobile App (iOS / Android Live Preview)",
      Condition: "Brand New (2 Years System Warranty)",
    },
  },
];

export type Service = {
  id: string;
  title: string;
  description: string;
  iconName: string;
};

export const services: Service[] = [
  { id: "laptop-repair", title: "Laptop Repair", description: "Fast, board-level diagnostics and component replacement for all major laptop brands.", iconName: "Laptop" },
  { id: "desktop-repair", title: "Desktop Repair", description: "Diagnostics, hardware upgrades, and software optimization for individual desktops and workstations.", iconName: "Cpu" },
  { id: "windows-installation", title: "Windows Installation", description: "Genuine OS setup with drivers, optimization, and software package installations.", iconName: "MonitorDot" },
  { id: "linux-installation", title: "Linux Installation", description: "Dual-boot configurations or dedicated Linux environments for developers and servers.", iconName: "Terminal" },
  { id: "software-installation", title: "Software Installation", description: "Setup of professional tool suites, development IDEs, antivirus, and utilities.", iconName: "Layers" },
  { id: "networking", title: "Networking & Wifi Solutions", description: "LAN cabling, router configurations, range extenders, and complete office WiFi setups.", iconName: "Wifi" },
  { id: "amc", title: "Annual Maintenance Contracts (AMC)", description: "Proactive IT maintenance schedules keeping corporate computer systems operational and updated.", iconName: "ClipboardCheck" },
  { id: "printer-installation", title: "Printer Installation", description: "Wired, wireless, and network setup for printers, scanners, and shared network drives.", iconName: "Printer" },
  { id: "data-recovery", title: "Data Recovery", description: "Secure, confidential recovery of lost data from failing HDDs, SSDs, and formatted flash media.", iconName: "HardDrive" },
  { id: "website-development", title: "Website Development", description: "Corporate landing pages, portfolio sites, and custom applications built on modern stacks.", iconName: "Code" },
  { id: "android-development", title: "Android Application Development", description: "Custom Android applications designed around your workflow and customers.", iconName: "Smartphone" },
  { id: "custom-pc", title: "Custom PC Assembly", description: "Gaming rigs, editing workstations, and deep learning servers tailored to your specifications.", iconName: "Gamepad2" },
  { id: "hardware-upgrade", title: "Hardware Upgrades", description: "Swap out old mechanical drives for SSDs, expand RAM, or upgrade processors to extend PC lifespan.", iconName: "ArrowUpCircle" },
  { id: "remote-support", title: "Remote Technical Support", description: "On-call remote assistance resolving software glitches, virus cleanup, and driver conflicts.", iconName: "Headphones" },
  { id: "cloud-backup", title: "Cloud Backup Configurations", description: "Automated off-site backup setup protecting critical business documents from local hardware loss.", iconName: "Cloud" },
];

export type Stat = {
  id: string;
  label: string;
  value: number;
  suffix: string;
};

export const stats: Stat[] = [
  { id: "clients", label: "Happy Clients", value: 2500, suffix: "+" },
  { id: "repairs", label: "Devices Serviced", value: 8000, suffix: "+" },
  { id: "years", label: "Years of Trust", value: 6, suffix: "+" },
  { id: "warranty", label: "Warranty Coverage", value: 100, suffix: "%" },
];

export const trustBadges: string[] = [
  "100% Tested Products",
  "Genuine Components",
  "Warranty Support",
  "Doorstep Service",
  "Best Price Guarantee",
  "Trusted Local Business",
];

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Ramesh Kumar",
    role: "Small Business Owner, Bengaluru",
    quote:
      "NexLapTech set up our entire office network and desktops in a single weekend. Everything just works, and their AMC keeps it that way.",
    rating: 5,
  },
  {
    id: "t2",
    name: "Ananya Rao",
    role: "College Student",
    quote:
      "Bought a second-hand premium laptop for my design work — thoroughly tested, great price, and the warranty gave me total peace of mind.",
    rating: 5,
  },
  {
    id: "t3",
    name: "Suresh Babu",
    role: "Retail Store Owner",
    quote:
      "Their CCTV installation team was professional and fast. Support after installation has been excellent every time we've called.",
    rating: 5,
  },
  {
    id: "t4",
    name: "Priya Sharma",
    role: "Homemaker",
    quote:
      "Doorstep laptop repair saved me a trip across the city. Transparent pricing and honest advice — exactly what I needed.",
    rating: 5,
  },
];

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export const faqs: FAQItem[] = [
  {
    id: "f1",
    question: "Do you offer warranty on second-hand laptops?",
    answer:
      "Yes — every second-hand premium laptop we sell is tested across all core components and comes with a warranty period, so you get premium performance with genuine peace of mind.",
  },
  {
    id: "f2",
    question: "Do you provide doorstep service in Bengaluru?",
    answer:
      "Yes, we offer doorstep diagnostics, repair, and installation across Bengaluru, along with our Tumkur branch. Just book a service through our form or WhatsApp us directly.",
  },
  {
    id: "f3",
    question: "Can you supply computers and laptops in bulk for businesses?",
    answer:
      "Absolutely. We handle bulk laptop and desktop supply for offices, institutions, and training centres, with standardised specs, quality checks, and flexible delivery timelines.",
  },
  {
    id: "f4",
    question: "Do you build custom gaming or workstation PCs?",
    answer:
      "Yes, our custom PC assembly service is tailored to your exact use case — gaming, content creation, or professional workstation builds — using genuine, tested components.",
  },
  {
    id: "f5",
    question: "What areas do you serve besides Bengaluru?",
    answer:
      "We operate from our Bengaluru head office and Tumkur branch, with a new branch opening soon in Hiriyur. Reach out to check service availability in your area.",
  },
  {
    id: "f6",
    question: "How do I book a service?",
    answer:
      "You can book a service instantly using our online form, message us on WhatsApp, or call either of our support numbers directly.",
  },
];

export const galleryImages = [
  { src: "/assets/nexlaptech-logo.webp", alt: "NEXLAPTECH Logo" },
  { src: "/images/poster-products.webp", alt: "NexLapTech product range — desktops, laptops, accessories, CCTV" },
  { src: "/images/poster-services.webp", alt: "NexLapTech service range — repair, networking, AMC and more" },
  { src: "/assets/nexlaptech-logo.webp", alt: "NEXLAPTECH Logo" },
];
