"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Search, Filter, Zap, Eye, EyeOff, X, ChevronDown, AlertTriangle, Globe, FileText } from "lucide-react"
import NetworkGraph from "@/components/network-graph"
import Analysis from "@/components/analysis" // Declare the Analysis component
import { Textarea } from "@/components/ui/textarea"
import SimilarityHistogram from "@/components/similarity-histogram"

interface Node {
  id: string
  label: string
  type: string
  size: number
  color: string
  summary: string // Brief description for tooltip
  content: string // Full article content for modal
  similarity?: number
  continent: string
  country: string
  stateProvince: string | null
  sourceType: string
  url: string
  x?: number
  y?: number
  vx?: number
  vy?: number
}

const sampleNodes = [
  {
    id: "1",
    label: "Central Hub",
    type: "hub",
    size: 20,
    color: "#15803d",
    summary: "Central processing hub for system coordination and management orchestration control",
    content:
      "The Central Hub serves as the primary coordination point for all system operations within our distributed architecture. This critical component manages the flow of information between various subsystems, ensuring optimal performance and reliability. The hub implements advanced load balancing algorithms and provides real-time monitoring capabilities. It features redundant failover mechanisms and supports horizontal scaling to accommodate growing system demands. The architecture includes sophisticated routing logic that intelligently directs traffic based on current system load and availability metrics.",
    similarity: 85,
    continent: "North America",
    country: "USA",
    stateProvince: "California",
    sourceType: "Government Website",
    url: "https://docs.centralhub.gov/architecture",
  },
  {
    id: "2",
    label: "Data Source A",
    type: "source",
    size: 15,
    color: "#84cc16",
    summary: "Primary data source for input stream information collection and real-time analytics",
    content:
      "Data Source A represents our primary data ingestion pipeline, responsible for collecting and processing high-volume information streams from multiple external sources. This system implements advanced data validation and cleansing algorithms to ensure data quality and consistency. The architecture supports both batch and real-time processing modes, with automatic failover capabilities to secondary data sources when needed. Integration with our analytics platform enables immediate insights and trend analysis. The system maintains comprehensive audit logs and supports data lineage tracking for compliance requirements.",
    similarity: 72,
    continent: "Europe",
    country: "Germany",
    stateProvince: null,
    sourceType: "Law Firm",
    url: "https://legal.datasource-a.de/documentation",
  },
  {
    id: "3",
    label: "Data Source B",
    type: "source",
    size: 15,
    color: "#84cc16",
    summary: "Secondary data source providing backup information streams and redundancy failover",
    content:
      "Data Source B functions as our secondary data ingestion system, providing critical redundancy and backup capabilities for our primary data streams. This system automatically activates during primary source failures, ensuring continuous data flow and system availability. The implementation includes sophisticated data synchronization mechanisms that maintain consistency across multiple data sources. Advanced monitoring systems track data quality metrics and automatically alert administrators to potential issues. The architecture supports seamless scaling and can handle sudden spikes in data volume without performance degradation.",
    similarity: 68,
    continent: "North America",
    country: "Canada",
    stateProvince: "Ontario",
    sourceType: "News Article",
    url: "https://news.datasource-b.ca/technical-specs",
  },
  {
    id: "4",
    label: "Processing Unit",
    type: "processor",
    size: 12,
    color: "#d97706",
    summary: "High-performance processing unit for computation, calculation, and algorithmic analysis",
    content:
      "The Processing Unit represents the computational core of our system, designed to handle complex mathematical operations and algorithmic processing tasks. This component utilizes advanced parallel processing techniques to maximize throughput and minimize latency. The architecture includes specialized optimization algorithms that automatically adjust processing parameters based on workload characteristics. Integration with machine learning frameworks enables adaptive performance tuning and predictive resource allocation. The system supports both CPU and GPU-accelerated computing for maximum flexibility and performance.",
    similarity: 91,
    continent: "Asia",
    country: "Japan",
    stateProvince: null,
    sourceType: "NGO",
    url: "https://ngo.processing-unit.jp/research",
  },
  {
    id: "5",
    label: "Analytics Engine",
    type: "processor",
    size: 12,
    color: "#d97706",
    summary: "Advanced analytics engine with machine learning and AI capabilities for pattern recognition",
    content:
      "Our Analytics Engine combines cutting-edge machine learning algorithms with traditional statistical analysis to provide comprehensive insights from complex datasets. The system implements neural networks, deep learning models, and advanced pattern recognition techniques to identify trends and anomalies in real-time. The architecture supports both supervised and unsupervised learning approaches, with automatic model selection and hyperparameter optimization. Integration with our data pipeline enables continuous learning and model improvement. The engine provides RESTful APIs for easy integration with external systems and supports multiple output formats for diverse use cases.",
    similarity: 94,
    continent: "Europe",
    country: "France",
    stateProvince: null,
    sourceType: "Government Website",
    url: "https://analytics.gouv.fr/engine-docs",
  },
  {
    id: "6",
    label: "User Interface",
    type: "interface",
    size: 10,
    color: "#ea580c",
    summary: "Frontend display for visualization dashboard interaction and responsive design experience",
    content:
      "The User Interface provides a seamless and intuitive experience for interacting with our system. This component features a responsive design that adapts to various screen sizes and devices. The architecture includes interactive dashboards, real-time data visualizations, and customizable reporting tools. Integration with our analytics engine enables users to explore data trends and patterns with ease. The system supports role-based access control and provides comprehensive audit logs for security and compliance purposes.",
    similarity: 45,
    continent: "North America",
    country: "USA",
    stateProvince: "Texas",
    sourceType: "Law Firm",
    url: "https://legal.ui-systems.com/interface-guide",
  },
  {
    id: "7",
    label: "Database",
    type: "storage",
    size: 18,
    color: "#374151",
    summary: "Storage persistence data warehouse repository for relational and NoSQL information",
    content:
      "Our Database system provides robust and scalable data storage capabilities, supporting both relational and NoSQL data models. This component implements advanced data replication and backup mechanisms to ensure data durability and availability. The architecture includes automated data partitioning and indexing strategies to optimize query performance. Integration with our analytics engine enables real-time data analysis and reporting. The system supports multiple data encryption standards and provides comprehensive access control mechanisms for security and compliance.",
    similarity: 78,
    continent: "North America",
    country: "Canada",
    stateProvince: "Québec",
    sourceType: "News Article",
    url: "https://tech.database-news.ca/storage-architecture",
  },
  {
    id: "8",
    label: "API Gateway",
    type: "gateway",
    size: 14,
    color: "#f97316",
    summary: "Service endpoint routing authentication authorization security middleware proxy",
    content:
      "The API Gateway serves as the entry point for all external requests to our system, providing secure and efficient access to our backend services. This component implements advanced routing and load balancing algorithms to optimize performance and reliability. The architecture includes comprehensive authentication and authorization mechanisms to protect sensitive data and prevent unauthorized access. Integration with our monitoring system enables real-time tracking of API usage and performance metrics. The gateway supports multiple API protocols and provides rate limiting capabilities to prevent abuse.",
    similarity: 63,
    continent: "Europe",
    country: "Luxembourg",
    stateProvince: null,
    sourceType: "NGO",
    url: "https://ngo.api-gateway.lu/service-docs",
  },
  {
    id: "9",
    label: "Cache Layer",
    type: "cache",
    size: 8,
    color: "#84cc16",
    summary: "Memory fast access temporary storage performance optimization redis memcached",
    content:
      "Our Cache Layer provides high-speed data access, significantly improving system performance and reducing latency. This component utilizes in-memory data storage and advanced caching algorithms to minimize database load. The architecture includes automatic cache invalidation and data synchronization mechanisms to ensure data consistency. Integration with our monitoring system enables real-time tracking of cache hit rates and performance metrics. The cache layer supports multiple caching strategies and can be easily scaled to accommodate growing system demands.",
    similarity: 56,
    continent: "Asia",
    country: "South Korea",
    stateProvince: null,
    sourceType: "Government Website",
    url: "https://cache.go.kr/performance-guide",
  },
  {
    id: "10",
    label: "Load Balancer",
    type: "balancer",
    size: 16,
    color: "#15803d",
    summary: "Distribution traffic management scaling performance reliability nginx haproxy",
    content:
      "The Load Balancer distributes incoming network traffic across multiple servers, ensuring optimal performance and reliability. This component implements advanced load balancing algorithms and provides real-time monitoring capabilities. The architecture includes automatic failover mechanisms and supports horizontal scaling to accommodate growing system demands. Integration with our monitoring system enables real-time tracking of server health and performance metrics. The load balancer supports multiple protocols and can be easily configured to meet specific application requirements.",
    similarity: 82,
    continent: "North America",
    country: "Mexico",
    stateProvince: null,
    sourceType: "Law Firm",
    url: "https://legal.loadbalancer.mx/traffic-management",
  },
  {
    id: "11",
    label: "Message Queue",
    type: "queue",
    size: 13,
    color: "#7c3aed",
    summary: "Asynchronous communication pub sub messaging rabbitmq kafka event streaming",
    content:
      "Our Message Queue system enables asynchronous communication between different components of our system, improving scalability and reliability. This component supports publish-subscribe messaging patterns and provides robust message delivery guarantees. The architecture includes automatic message routing and prioritization mechanisms. Integration with our monitoring system enables real-time tracking of message queue performance and throughput. The message queue supports multiple messaging protocols and can be easily scaled to accommodate growing system demands.",
    similarity: 39,
    continent: "North America",
    country: "USA",
    stateProvince: "Illinois",
    sourceType: "News Article",
    url: "https://tech.messagequeue.com/async-patterns",
  },
  {
    id: "12",
    label: "Search Engine",
    type: "search",
    size: 11,
    color: "#dc2626",
    summary: "Elasticsearch indexing full text search lucene solr information retrieval",
    content:
      "The Search Engine provides powerful full-text search capabilities, enabling users to quickly find relevant information within our system. This component implements advanced indexing algorithms and supports multiple search operators. The architecture includes automatic data synchronization and backup mechanisms. Integration with our analytics engine enables real-time search analytics and reporting. The search engine supports multiple data formats and can be easily customized to meet specific application requirements.",
    similarity: 87,
    continent: "Europe",
    country: "Germany",
    stateProvince: null,
    sourceType: "NGO",
    url: "https://ngo.searchengine.de/indexing-guide",
  },
  {
    id: "13",
    label: "Monitoring System",
    type: "monitor",
    size: 9,
    color: "#059669",
    summary: "Observability metrics logging alerting prometheus grafana performance tracking",
    content:
      "Our Monitoring System provides comprehensive visibility into the health and performance of our system, enabling proactive issue detection and resolution. This component collects metrics, logs, and events from various system components and provides real-time dashboards and alerts. The architecture includes automatic anomaly detection and root cause analysis capabilities. Integration with our incident management system enables automated incident creation and resolution. The monitoring system supports multiple monitoring protocols and can be easily customized to meet specific application requirements.",
    similarity: 29,
    continent: "Oceania",
    country: "Australia",
    stateProvince: null,
    sourceType: "Government Website",
    url: "https://monitoring.gov.au/observability",
  },
  {
    id: "14",
    label: "Security Module",
    type: "security",
    size: 14,
    color: "#dc2626",
    summary: "Encryption authentication authorization firewall intrusion detection vulnerability scanning",
    content:
      "The Security Module provides comprehensive security capabilities, protecting our system from unauthorized access and cyber threats. This component implements encryption, authentication, authorization, and intrusion detection mechanisms. The architecture includes automatic vulnerability scanning and patch management capabilities. Integration with our incident management system enables automated incident creation and resolution. The security module supports multiple security standards and can be easily customized to meet specific application requirements.",
    similarity: 74,
    continent: "Europe",
    country: "France",
    stateProvince: null,
    sourceType: "Law Firm",
    url: "https://legal.security-systems.fr/encryption-docs",
  },
  {
    id: "15",
    label: "Backup Service",
    type: "backup",
    size: 10,
    color: "#6b7280",
    summary: "Disaster recovery data protection archival storage replication snapshot",
    content:
      "Our Backup Service provides robust data protection and disaster recovery capabilities, ensuring business continuity in the event of system failures or data loss. This component implements automatic data backup and replication mechanisms. The architecture includes offsite data storage and recovery capabilities. Integration with our monitoring system enables real-time tracking of backup status and performance. The backup service supports multiple backup strategies and can be easily customized to meet specific application requirements.",
    similarity: 51,
    continent: "Asia",
    country: "Japan",
    stateProvince: null,
    sourceType: "News Article",
    url: "https://backup.tech-news.jp/disaster-recovery",
  },
  {
    id: "16",
    label: "CDN Edge",
    type: "cdn",
    size: 12,
    color: "#0891b2",
    summary: "Content delivery network edge caching global distribution static assets performance optimization",
    content:
      "The CDN Edge provides high-performance content delivery capabilities, improving website performance and user experience. This component implements edge caching and global content distribution mechanisms. The architecture includes automatic content invalidation and synchronization capabilities. Integration with our monitoring system enables real-time tracking of CDN performance and usage. The CDN Edge supports multiple content formats and can be easily customized to meet specific application requirements.",
    similarity: 66,
    continent: "North America",
    country: "Canada",
    stateProvince: "Ontario",
    sourceType: "NGO",
    url: "https://ngo.cdn-edge.ca/global-distribution",
  },
  {
    id: "17",
    label: "ML Pipeline",
    type: "ml",
    size: 15,
    color: "#7c2d12",
    summary: "Training inference model deployment tensorflow pytorch scikit learn",
    content:
      "Our ML Pipeline provides a comprehensive platform for developing, training, and deploying machine learning models. This component implements automated model training and evaluation mechanisms. The architecture includes support for multiple machine learning frameworks and libraries. Integration with our data pipeline enables seamless data ingestion and preprocessing. The ML Pipeline supports multiple deployment options and can be easily scaled to accommodate growing model complexity.",
    similarity: 96,
    continent: "Asia",
    country: "South Korea",
    stateProvince: null,
    sourceType: "Government Website",
    url: "https://ml.go.kr/pipeline-architecture",
  },
  {
    id: "18",
    label: "Event Bus",
    type: "event",
    size: 11,
    color: "#be185d",
    summary: "Event driven architecture microservices communication decoupling reactive systems",
    content:
      "The Event Bus enables event-driven communication between different microservices, improving system scalability and resilience. This component implements publish-subscribe messaging patterns and provides robust event delivery guarantees. The architecture includes automatic event routing and filtering mechanisms. Integration with our monitoring system enables real-time tracking of event bus performance and throughput. The event bus supports multiple event formats and can be easily scaled to accommodate growing system complexity.",
    similarity: 58,
    continent: "Europe",
    country: "Luxembourg",
    stateProvince: null,
    sourceType: "Law Firm",
    url: "https://legal.eventbus.lu/microservices-guide",
  },
  {
    id: "19",
    label: "Config Manager",
    type: "config",
    size: 8,
    color: "#4338ca",
    summary: "Environment variables secrets consul etcd centralized configuration",
    content:
      "Our Config Manager provides centralized configuration management capabilities, simplifying the deployment and management of our system. This component implements version control and access control mechanisms. The architecture includes support for multiple configuration formats and environments. Integration with our deployment pipeline enables automated configuration updates. The config manager supports multiple configuration sources and can be easily customized to meet specific application requirements.",
    similarity: 42,
    continent: "North America",
    country: "USA",
    stateProvince: "California",
    sourceType: "News Article",
    url: "https://config.tech-news.com/centralized-management",
  },
  {
    id: "20",
    label: "Notification Hub",
    type: "notification",
    size: 9,
    color: "#f59e0b",
    summary: "Push messaging email sms alerts real-time communication user engagement",
    content:
      "The Notification Hub provides a centralized platform for sending notifications to users, improving user engagement and retention. This component implements push messaging, email, and SMS notification channels. The architecture includes support for multiple notification formats and delivery options. Integration with our analytics engine enables real-time tracking of notification performance and user engagement. The notification hub supports multiple notification providers and can be easily customized to meet specific application requirements.",
    similarity: 33,
    continent: "Europe",
    country: "Germany",
    stateProvince: null,
    sourceType: "NGO",
    url: "https://ngo.notifications.de/messaging-platform",
  },
  {
    id: "21",
    label: "Payment Gateway",
    type: "payment",
    size: 13,
    color: "#10b981",
    summary: "Financial transaction processing payment methods stripe paypal secure checkout",
    content:
      "The Payment Gateway handles all financial transactions within our system, providing secure and reliable payment processing capabilities. This component supports multiple payment methods including credit cards, digital wallets, and bank transfers. The architecture includes PCI DSS compliance mechanisms and fraud detection algorithms. Integration with major payment providers enables global transaction processing. The gateway provides real-time transaction monitoring and comprehensive reporting for financial analysis.",
    similarity: 67,
    continent: "Europe",
    country: "Netherlands",
    stateProvince: null,
    sourceType: "Government Website",
    url: "https://payments.gov.nl/gateway-docs",
  },
  {
    id: "22",
    label: "Content Manager",
    type: "cms",
    size: 11,
    color: "#8b5cf6",
    summary: "Content management system editorial workflow publishing media assets",
    content:
      "Our Content Manager provides a comprehensive platform for creating, editing, and publishing digital content. This component features a user-friendly editorial interface with version control and workflow management. The architecture includes media asset management and automated content optimization. Integration with our CDN ensures fast content delivery globally. The system supports multiple content formats and provides SEO optimization tools for better search visibility.",
    similarity: 54,
    continent: "Europe",
    country: "Italy",
    stateProvince: null,
    sourceType: "News Article",
    url: "https://content.tech-italia.it/cms-platform",
  },
  {
    id: "23",
    label: "Identity Provider",
    type: "identity",
    size: 12,
    color: "#f59e0b",
    summary: "Single sign-on authentication SAML OAuth2 user identity management",
    content:
      "The Identity Provider serves as the central authentication hub for our system, enabling single sign-on across all applications. This component implements industry-standard protocols including SAML, OAuth2, and OpenID Connect. The architecture includes multi-factor authentication and adaptive security policies. Integration with external identity providers enables federated authentication. The system provides comprehensive audit logs and supports role-based access control for enhanced security.",
    similarity: 81,
    continent: "Europe",
    country: "Spain",
    stateProvince: null,
    sourceType: "Law Firm",
    url: "https://legal.identity-systems.es/sso-guide",
  },
]

const sampleLinks = [
  { source: "1", target: "2", type: "data", strength: 3 },
  { source: "1", target: "3", type: "data", strength: 3 },
  { source: "1", target: "4", type: "processing", strength: 2 },
  { source: "4", target: "5", type: "processing", strength: 4 },
  { source: "5", target: "6", type: "output", strength: 2 },
  { source: "1", target: "7", type: "storage", strength: 5 },
  { source: "8", target: "1", type: "gateway", strength: 3 },
  { source: "7", target: "9", type: "cache", strength: 2 },
  { source: "10", target: "8", type: "load", strength: 4 },
  { source: "2", target: "7", type: "storage", strength: 2 },
  { source: "3", target: "7", type: "storage", strength: 2 },
  { source: "11", target: "1", type: "messaging", strength: 3 },
  { source: "5", target: "11", type: "messaging", strength: 2 },
  { source: "12", target: "7", type: "indexing", strength: 3 },
  { source: "6", target: "12", type: "search", strength: 2 },
  { source: "13", target: "1", type: "monitoring", strength: 2 },
  { source: "13", target: "8", type: "monitoring", strength: 2 },
  { source: "13", target: "7", type: "monitoring", strength: 2 },
  { source: "14", target: "8", type: "security", strength: 4 },
  { source: "14", target: "6", type: "security", strength: 3 },
  { source: "15", target: "7", type: "backup", strength: 3 },
  { source: "16", target: "6", type: "cdn", strength: 3 },
  { source: "16", target: "10", type: "cdn", strength: 2 },
  { source: "17", target: "5", type: "ml", strength: 4 },
  { source: "17", target: "7", type: "ml", strength: 3 },
  { source: "18", target: "11", type: "event", strength: 3 },
  { source: "18", target: "1", type: "event", strength: 2 },
  { source: "19", target: "1", type: "config", strength: 2 },
  { source: "19", target: "8", type: "config", strength: 2 },
  { source: "20", target: "6", type: "notification", strength: 2 },
  { source: "20", target: "11", type: "notification", strength: 3 },
  { source: "4", target: "17", type: "processing", strength: 2 },
  { source: "9", target: "12", type: "cache", strength: 2 },
  { source: "14", target: "15", type: "security", strength: 2 },
  { source: "13", target: "20", type: "alerting", strength: 3 },
  { source: "21", target: "8", type: "payment", strength: 4 },
  { source: "21", target: "14", type: "security", strength: 5 },
  { source: "22", target: "16", type: "cdn", strength: 3 },
  { source: "22", target: "7", type: "storage", strength: 2 },
  { source: "23", target: "14", type: "security", strength: 4 },
  { source: "23", target: "8", type: "identity", strength: 3 },
  { source: "6", target: "21", type: "payment", strength: 2 },
  { source: "6", target: "22", type: "content", strength: 2 },
  { source: "6", target: "23", type: "identity", strength: 3 },
]

const calculateSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0

  const words1 = text1
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
  const words2 = text2
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)

  if (words1.length === 0 || words2.length === 0) return 0

  // Create word frequency maps
  const freq1: { [key: string]: number } = {}
  const freq2: { [key: string]: number } = {}

  words1.forEach((word) => (freq1[word] = (freq1[word] || 0) + 1))
  words2.forEach((word) => (freq2[word] = (freq2[word] || 0) + 1))

  // Calculate cosine similarity
  const allWords = new Set([...words1, ...words2])
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  allWords.forEach((word) => {
    const f1 = freq1[word] || 0
    const f2 = freq2[word] || 0
    dotProduct += f1 * f2
    norm1 += f1 * f1
    norm2 += f2 * f2
  })

  if (norm1 === 0 || norm2 === 0) return 0
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

export default function NetworkGraphApp() {
  const [apiKey, setApiKey] = useState("")
  const hasApiKey = apiKey.trim().length > 0

  const [colorMode, setColorMode] = useState<"sourceType" | "continent" | "similarityRange">("sourceType")
  const [nodeSizeMode, setNodeSizeMode] = useState<"none" | "contentLength" | "summaryLength" | "similarity">("none")

  const [searchTerm, setSearchTerm] = useState("")
  const [searchMode, setSearchMode] = useState<"fulltext" | "semantic">("fulltext")
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([])
  const [selectedLinkTypes, setSelectedLinkTypes] = useState<string[]>([])
  const [selectedContinents, setSelectedContinents] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedStateProvinces, setSelectedStateProvinces] = useState<string[]>([])
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([])
  const [minNodeSize, setMinNodeSize] = useState([0])
  const [maxNodeSize, setMaxNodeSize] = useState([100])
  const [showLabels, setShowLabels] = useState(true)
  const [useSimilaritySize, setUseSimilaritySize] = useState(false)
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])
  const [highlightedLinks, setHighlightedLinks] = useState<string[]>([])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [showDescriptionSummary, setShowDescriptionSummary] = useState(false)
  const [showThemeAnalysis, setShowThemeAnalysis] = useState(false)
  const [collapsedThemes, setCollapsedThemes] = useState<string[]>([])
  const [showSummaryAnalysis, setShowSummaryAnalysis] = useState(false)
  const [showBusinessAnalysis, setShowBusinessAnalysis] = useState(false)
  const [showThemesAnalysis, setShowThemesAnalysis] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingBusiness, setLoadingBusiness] = useState(false)
  const [loadingThemes, setLoadingThemes] = useState(false)
  const [showMethodology, setShowMethodology] = useState<{ [key: string]: boolean }>({})
  const [deselectedNodeTypes, setDeselectedNodeTypes] = useState<string[]>([])
  const [expandedNodes, setExpandedNodes] = useState<string[]>([])
  const [layoutType, setLayoutType] = useState<"radial" | "tree">("radial")
  const [showFilterTypes, setShowFilterTypes] = useState(false)
  const [showActiveNodes, setShowActiveNodes] = useState(false)
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false)

  const [chatInput, setChatInput] = useState("")
  const [conversations, setConversations] = useState<
    Array<{
      id: string
      prompt: string
      response: string
      timestamp: Date
      feedback?: "up" | "down"
    }>
  >([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [selectedSimilarityRange, setSelectedSimilarityRange] = useState<string[]>([])

  const [histogramExpanded, setHistogramExpanded] = useState(true)

  const reorganizeLayoutRef = useRef<(() => void) | null>(null)
  const arrangeAsTreeRef = useRef<(() => void) | null>(null)

  const nodeTypes = [...new Set(sampleNodes.map((node) => node.type))]
  const linkTypes = [...new Set(sampleLinks.map((link) => link.type))]
  const continents = [...new Set(sampleNodes.map((node) => node.continent))]
  const countries = [...new Set(sampleNodes.map((node) => node.country))]
  const stateProvinces = [...new Set(sampleNodes.map((node) => node.stateProvince).filter(Boolean))]
  const sourceTypes = [...new Set(sampleNodes.map((node) => node.sourceType))]

  const [topResults, setTopResults] = useState(10)
  const [similarityThreshold, setSimilarityThreshold] = useState("all")

  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchStatus, setSearchStatus] = useState<string>("")

  const [expandedContinents, setExpandedContinents] = useState<string[]>([])

  const removeFromHistory = (indexToRemove: number) => {
    setSearchHistory((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleExpandQuery = () => {
    if (!hasApiKey) return
    // TODO: Implement AI query expansion using the API key
    console.log("[v0] Expanding query with AI:", searchTerm)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setSearchStatus("")

    // Add to search history if not already present
    if (!searchHistory.includes(searchTerm.trim())) {
      setSearchHistory((prev) => [searchTerm.trim(), ...prev.slice(0, 4)])
    }

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSearching(false)
    setHasSearched(true)
    setShowSearchHistory(false)

    if (highlightedNodes.length > 0) {
      setSearchStatus(`Found ${highlightedNodes.length} results with 95%+ similarity`)
    } else {
      setSearchStatus("No matches found - try different terms")
    }
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setHasSearched(false)
    setShowSearchHistory(false)
    setSearchStatus("")
  }

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term)
    setShowSearchHistory(false)
  }

  const getNodeColorByMode = (node: Node, mode: string) => {
    switch (mode) {
      case "sourceType":
        const sourceTypeColors = {
          "Government Website": "#3b82f6", // Blue
          "Law Firm": "#dc2626", // Red
          "News Article": "#059669", // Green
          NGO: "#7c3aed", // Purple
        }
        return sourceTypeColors[node.sourceType as keyof typeof sourceTypeColors] || "#6b7280"

      case "country":
        const countryColors = {
          USA: "#dc2626", // Red
          Germany: "#000000", // Black
          Canada: "#dc2626", // Red
          Japan: "#dc2626", // Red
          France: "#3b82f6", // Blue
          Luxembourg: "#3b82f6", // Blue
          Mexico: "#059669", // Green
          "South Korea": "#f59e0b", // Yellow
          Australia: "#7c3aed", // Purple
        }
        return countryColors[node.country as keyof typeof countryColors] || "#6b7280"

      case "continent":
        const continentColors = {
          "North America": "#dc2626", // Red
          "European Union": "#3b82f6", // Blue
          Asia: "#f59e0b", // Yellow
          Oceania: "#7c3aed", // Purple
        }
        return continentColors[node.continent as keyof typeof continentColors] || "#6b7280"

      case "similarityRange":
        if (!node.similarity) return "#6b7280"
        if (node.similarity <= 33) return "#dc2626" // Red for Low
        if (node.similarity <= 66) return "#f59e0b" // Yellow for Medium
        return "#059669" // Green for High

      default:
        return node.color
    }
  }

  const getNodeSize = (node: Node): number => {
    let nodeSize = node.size
    if (nodeSizeMode === "none") {
      nodeSize = node.size // Use original node size
    } else if (nodeSizeMode === "contentLength") {
      const contentLength = node.content.length
      nodeSize = Math.max(8, Math.min(25, 8 + (contentLength / 100) * 17))
    } else if (nodeSizeMode === "summaryLength") {
      const summaryLength = node.summary.length
      nodeSize = Math.max(8, Math.min(25, 8 + (summaryLength / 50) * 17))
    } else if (nodeSizeMode === "similarity") {
      const similarity = node.similarity
      nodeSize = Math.max(8, Math.min(25, 8 + (similarity / 100) * 17))
    }
    return nodeSize
  }

  // const histogramData = useMemo(() => {
  //   const ranges = [
  //   { range: "<20", min: 0, max: 19 },
  //   { range: "21-40", min: 21, max: 40 },
  //   { range: "41-60", min: 41, max: 60 },
  //   { range: "61-80", min: 61, max: 80 },
  //   { range: "80-100", min: 80, max: 100 },
  //   ]

  //   return ranges.map(({ range, min, max }) => {
  //   const count = sampleNodes.filter((node) => node.similarity >= min && node.similarity <= max).length
  //   const maxCount = Math.max(
  //     ...ranges.map((r) => sampleNodes.filter((node) => node.similarity >= r.min && node.similarity <= r.max).length),
  //   )
  //   // Fix: Increase minimum height and overall scale
  //   const height = Math.max(30, (count / Math.max(maxCount, 1)) * 80)

  //   return { range, count, height, min, max }
  //   })
  // }, [sampleNodes])

  const filteredNodes = useMemo(() => {
    return sampleNodes
      .filter((node) => {
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase()
          return (
            node.label.toLowerCase().includes(searchLower) ||
            node.summary.toLowerCase().includes(searchLower) ||
            node.content.toLowerCase().includes(searchLower)
          )
        }
        return true
      })
      .filter((node) => selectedContinents.length === 0 || selectedContinents.includes(node.continent))
      .filter((node) => selectedCountries.length === 0 || selectedCountries.includes(node.country))
      .filter((node) => selectedStateProvinces.length === 0 || selectedStateProvinces.includes(node.stateProvince))
      .filter((node) => selectedSourceTypes.length === 0 || selectedSourceTypes.includes(node.sourceType))
      .filter((node) => {
        if (selectedSimilarityRange.length > 0) {
          const similarity = node.similarity || 0
          return selectedSimilarityRange.some((range) => {
            if (range === "<20") {
              return similarity >= 0 && similarity <= 19
            } else if (range === "80-100") {
              return similarity >= 80 && similarity <= 100
            } else {
              const [min, max] = range.split("-").map((s) => Number.parseInt(s))
              return similarity >= min && similarity <= max
            }
          })
        }
        return true
      })
      .map((node) => {
        let updatedNode = { ...node }

        // Apply color based on selected mode
        updatedNode.color = getNodeColorByMode(node, colorMode)

        let nodeSize = node.size
        if (nodeSizeMode === "none") {
          nodeSize = node.size // Use original node size
        } else if (nodeSizeMode === "contentLength") {
          const contentLength = node.content.length
          nodeSize = Math.max(8, Math.min(25, 8 + (contentLength / 100) * 17))
        } else if (nodeSizeMode === "summaryLength") {
          const summaryLength = node.summary.length
          nodeSize = Math.max(8, Math.min(25, 8 + (summaryLength / 50) * 17))
        } else if (nodeSizeMode === "similarity") {
          const similarity = node.similarity
          nodeSize = Math.max(8, Math.min(25, 8 + (similarity / 100) * 17))
        }

        if ((useSimilaritySize || searchMode === "semantic") && searchTerm.trim()) {
          const similarity = calculateSimilarity(searchTerm, node.summary)
          const similaritySize = Math.max(5, nodeSize * (0.3 + similarity * 1.4))
          updatedNode = { ...updatedNode, size: similaritySize, similarity }
        } else {
          updatedNode = { ...updatedNode, size: nodeSize }
        }
        return updatedNode
      })
      .filter((node) => {
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase()
          return (
            node.label.toLowerCase().includes(searchLower) ||
            node.summary.toLowerCase().includes(searchLower) ||
            node.content.toLowerCase().includes(searchLower) ||
            node.type.toLowerCase().includes(searchLower) ||
            node.continent.toLowerCase().includes(searchLower) ||
            node.country.toLowerCase().includes(searchLower) ||
            node.sourceType.toLowerCase().includes(searchLower)
          )
        }
        return true
      })
      .filter((node) => selectedNodeTypes.length === 0 || selectedNodeTypes.includes(node.type))
      .filter(
        (node) => selectedLinkTypes.length === 0 || selectedLinkTypes.some((type) => node.connections?.includes(type)),
      )
      .filter((node) => selectedCountries.length === 0 || selectedCountries.includes(node.country)) // Filter by countries instead of continents
      .filter((node) => selectedSourceTypes.length === 0 || selectedSourceTypes.includes(node.sourceType))
      .filter((node) => {
        if (minNodeSize[0] > 0) {
          const nodeSize = getNodeSize(node)
          return nodeSize >= minNodeSize[0]
        }
        return true
      })
  }, [
    searchTerm,
    sampleNodes,
    selectedNodeTypes,
    selectedLinkTypes,
    selectedCountries,
    selectedSourceTypes,
    minNodeSize,
    nodeSizeMode,
    colorMode,
    useSimilaritySize,
    searchMode,
    selectedContinents,
    selectedStateProvinces,
    selectedSimilarityRange,
  ])

  const filteredLinks = useMemo(() => {
    return sampleLinks.filter((link) => {
      const matchesType = selectedLinkTypes.length === 0 || selectedLinkTypes.includes(link.type)
      const sourceExists = filteredNodes.some((node) => node.id === link.source)
      const targetExists = filteredNodes.some((node) => node.id === link.target)
      return matchesType && sourceExists && targetExists
    })
  }, [selectedLinkTypes, filteredNodes])

  useEffect(() => {
    if (searchTerm) {
      const matchingNodes = filteredNodes
        .filter((node) => node.label.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((node) => node.id)
      setHighlightedNodes(matchingNodes)

      const matchingLinks = filteredLinks
        .filter((link) => matchingNodes.includes(link.source) || matchingNodes.includes(link.target))
        .map((link) => `${link.source}-${link.target}`)
      setHighlightedLinks(matchingLinks)
    } else {
      setHighlightedNodes([])
      setHighlightedLinks([])
    }
  }, [searchTerm, filteredNodes, filteredLinks])

  const toggleNodeType = (type: string) => {
    setSelectedNodeTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const toggleContinent = (continent: string) => {
    setSelectedContinents((prev) =>
      prev.includes(continent) ? prev.filter((c) => c !== continent) : [...prev, continent],
    )
  }

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]))
  }

  const toggleStateProvince = (stateProvince: string) => {
    setSelectedStateProvinces((prev) =>
      prev.includes(stateProvince) ? prev.filter((s) => s !== stateProvince) : [...prev, stateProvince],
    )
  }

  const toggleSourceType = (sourceType: string) => {
    setSelectedSourceTypes((prev) =>
      prev.includes(sourceType) ? prev.filter((s) => s !== sourceType) : [...prev, sourceType],
    )
  }

  const toggleLinkType = (type: string) => {
    setSelectedLinkTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSearchMode("fulltext")
    setSelectedNodeTypes([])
    setSelectedLinkTypes([])
    setSelectedContinents([])
    setSelectedCountries([])
    setSelectedStateProvinces([])
    setSelectedSourceTypes([])
    setExpandedContinents([]) // Clear expanded continents
    setMinNodeSize([0])
    setMaxNodeSize([100])
    setUseSimilaritySize(false)
    setDeselectedNodeTypes([])
    setShowDescriptionSummary(false)
    setShowThemeAnalysis(false)
    setExpandedNodes([])
    setShowFilterTypes(false)
  }

  const handleNodeSelection = (nodeIds: string[]) => {
    setSelectedNodes(nodeIds)
    setDeselectedNodeTypes([])
    setShowDescriptionSummary(false)
    setShowThemeAnalysis(false)
  }

  const clearSelection = () => {
    setSelectedNodes([])
    setDeselectedNodeTypes([])
    setShowDescriptionSummary(false)
    setShowThemeAnalysis(false)
  }

  const toggleNodeTypeDeselection = (type: string) => {
    setDeselectedNodeTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]))
  }

  const toggleThemeCollapse = (themeName: string) => {
    setCollapsedThemes((prev) =>
      prev.includes(themeName) ? prev.filter((name) => name !== themeName) : [...prev, themeName],
    )
  }

  const toggleMethodology = (section: string) => {
    setShowMethodology((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const removeNodeFromSelection = (nodeId: string) => {
    setSelectedNodes((prev) => prev.filter((id) => id !== nodeId))
  }

  const selectedNodesSummary = useMemo(() => {
    const allSelectedNodes = filteredNodes.filter((node) => selectedNodes.includes(node.id))
    const nodes = allSelectedNodes.filter((node) => !deselectedNodeTypes.includes(node.type))

    const types = [...new Set(nodes.map((n) => n.type))]
    const avgSize = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.size, 0) / nodes.length : 0
    const connections = filteredLinks.filter(
      (link) => selectedNodes.includes(link.source) || selectedNodes.includes(link.target),
    )
    const internalConnections = filteredLinks.filter(
      (link) => selectedNodes.includes(link.source) && selectedNodes.includes(link.target),
    )

    const textAnalysis = (() => {
      if (nodes.length === 0) return { commonWords: [], themes: [], summary: "" }

      // Combine all text from selected nodes
      const allText = nodes.map((n) => n.summary).join(" ")
      const words = allText
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3) // Filter out short words
        .filter((word) => !["data", "system", "service", "management"].includes(word)) // Filter common tech words

      // Count word frequency
      const wordFreq: { [key: string]: number } = {}
      words.forEach((word) => {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      })

      // Get most common words (appearing in multiple nodes or frequently)
      const commonWords = Object.entries(wordFreq)
        .filter(([_, count]) => count >= Math.max(2, Math.ceil(nodes.length * 0.3)))
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 8)
        .map(([word, count]) => ({ word, count }))

      // Identify themes based on word clusters
      const themes = []
      if (commonWords.some((w) => ["processing", "computation", "calculation", "algorithms"].includes(w.word))) {
        themes.push("Data Processing")
      }
      if (commonWords.some((w) => ["storage", "database", "persistence", "repository"].includes(w.word))) {
        themes.push("Data Storage")
      }
      if (commonWords.some((w) => ["security", "authentication", "authorization", "encryption"].includes(w.word))) {
        themes.push("Security")
      }
      if (commonWords.some((w) => ["monitoring", "performance", "metrics", "alerting"].includes(w.word))) {
        themes.push("Monitoring")
      }
      if (commonWords.some((w) => ["machine", "learning", "artificial", "intelligence"].includes(w.word))) {
        themes.push("AI/ML")
      }
      if (commonWords.some((w) => ["communication", "messaging", "queue", "event"].includes(w.word))) {
        themes.push("Communication")
      }

      // Generate a brief summary
      const summary =
        nodes.length === 1
          ? `Single ${nodes[0].type} node focused on ${nodes[0].summary.split(" ").slice(0, 6).join(" ")}...`
          : `${nodes.length} nodes spanning ${types.length} types. ${themes.length > 0 ? `Primary themes: ${themes.join(", ")}.` : ""} ${
              commonWords.length > 0
                ? `Key concepts: ${commonWords
                    .slice(0, 3)
                    .map((w) => w.word)
                    .join(", ")}.`
                : ""
            }`

      return { commonWords, themes, summary }
    })()

    const themeAnalysis = (() => {
      if (nodes.length === 0) return { themes: [] }

      const themes = [
        {
          name: "Data Processing & Analytics",
          keywords: [
            "processing",
            "computation",
            "calculation",
            "algorithms",
            "analytics",
            "machine",
            "learning",
            "artificial",
            "intelligence",
            "neural",
          ],
          nodes: [],
          score: 0,
        },
        {
          name: "Data Storage & Management",
          keywords: [
            "storage",
            "database",
            "persistence",
            "repository",
            "warehouse",
            "backup",
            "archival",
            "distributed",
          ],
          nodes: [],
          score: 0,
        },
        {
          name: "Security & Authentication",
          keywords: [
            "security",
            "authentication",
            "authorization",
            "encryption",
            "firewall",
            "intrusion",
            "vulnerability",
            "protection",
          ],
          nodes: [],
          score: 0,
        },
        {
          name: "Performance & Monitoring",
          keywords: [
            "monitoring",
            "performance",
            "metrics",
            "alerting",
            "optimization",
            "tracking",
            "observability",
            "logging",
          ],
          nodes: [],
          score: 0,
        },
        {
          name: "Communication & Messaging",
          keywords: [
            "communication",
            "messaging",
            "queue",
            "event",
            "notification",
            "streaming",
            "pub",
            "asynchronous",
          ],
          nodes: [],
          score: 0,
        },
        {
          name: "Infrastructure & Networking",
          keywords: ["load", "balancer", "gateway", "proxy", "routing", "distribution", "scaling", "cdn", "edge"],
          nodes: [],
          score: 0,
        },
        {
          name: "User Interface & Experience",
          keywords: [
            "interface",
            "frontend",
            "display",
            "visualization",
            "dashboard",
            "interaction",
            "responsive",
            "experience",
          ],
          nodes: [],
          score: 0,
        },
        {
          name: "Configuration & Management",
          keywords: [
            "configuration",
            "management",
            "environment",
            "variables",
            "secrets",
            "centralized",
            "orchestration",
            "control",
          ],
          nodes: [],
          score: 0,
        },
      ]

      themes.forEach((theme) => {
        nodes.forEach((node) => {
          const nodeWords = node.summary.toLowerCase().split(/\s+/)
          const matchCount = theme.keywords.filter((keyword) =>
            nodeWords.some((word) => word.includes(keyword) || keyword.includes(word)),
          ).length

          if (matchCount > 0) {
            const relevanceScore = matchCount / theme.keywords.length
            theme.nodes.push({
              ...node,
              relevanceScore,
              matchedKeywords: theme.keywords.filter((keyword) =>
                nodeWords.some((word) => word.includes(keyword) || keyword.includes(word)),
              ),
            })
            theme.score += relevanceScore
          }
        })

        theme.nodes.sort((a, b) => b.relevanceScore - a.relevanceScore)
        theme.nodes = theme.nodes.slice(0, 5)
      })

      const activeThemes = themes.filter((theme) => theme.nodes.length > 0).sort((a, b) => b.score - a.score)

      return { themes: activeThemes }
    })()

    return {
      nodes,
      allSelectedNodes,
      count: nodes.length,
      types,
      avgSize,
      totalConnections: connections.length,
      internalConnections: internalConnections.length,
      externalConnections: connections.length - internalConnections.length,
      textAnalysis,
      themeAnalysis,
    }
  }, [selectedNodes, filteredNodes, filteredLinks, deselectedNodeTypes])

  const handleCategoryClick = async (category: string) => {
    let prompt = ""
    switch (category) {
      case "Summary":
        prompt =
          selectedNodes.length > 0
            ? "Provide a comprehensive summary of the selected network nodes, highlighting their key themes and relationships."
            : "Provide an overview of the entire network structure and main components."
        break
      case "Business Impact":
        prompt =
          selectedNodes.length > 0
            ? "Analyze the business impact and implications of the selected network nodes."
            : "Analyze the overall business impact represented in this network."
        break
      case "Upcoming Changes":
        prompt =
          selectedNodes.length > 0
            ? "Identify potential upcoming changes or trends based on the selected network nodes."
            : "Identify potential upcoming changes or trends visible in the network."
        break
    }
    setChatInput(prompt)
    await handleSendMessage(prompt)
  }

  const handleSendMessage = async (message?: string) => {
    const promptToSend = message || chatInput
    if (!promptToSend.trim()) return

    setIsAnalyzing(true)
    const newConversation = {
      id: Date.now().toString(),
      prompt: promptToSend,
      response: "Thinking...",
      timestamp: new Date(),
    }

    setConversations((prev) => [...prev, newConversation])

    // Simulate analysis
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === newConversation.id
            ? {
                ...conv,
                response: `Based on your analysis request: "${promptToSend}", here are the key insights from the network data. This would contain the actual analysis results.`,
              }
            : conv,
        ),
      )
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleFeedback = (conversationId: string, feedback: "up" | "down") => {
    setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, feedback } : conv)))
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleRetry = (conversationId: string) => {
    const conversation = conversations.find((conv) => conv.id === conversationId)
    if (conversation) {
      handleSendMessage(conversation.prompt)
    }
  }

  const [selectedPill, setSelectedPill] = useState<string | null>(null)
  const [placeholder, setPlaceholder] = useState<string>(
    selectedNodes.length > 0 ? "Ask about AI regulations...." : "Ask about AI regulations....",
  )
  const [isThinking, setIsThinking] = useState(false)

  const setFeedback = (conversationId: string, feedback: "up" | "down") => {
    setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, feedback } : conv)))
  }

  const onNodeExpand = () => {
    // Placeholder function for node expansion logic
  }

  const handleSimilarityRangeClick = (range: string) => {
    setSelectedSimilarityRange(
      (prev) =>
        prev.includes(range)
          ? prev.filter((r) => r !== range) // Remove if already selected
          : [...prev, range], // Add if not selected
    )
  }

  const handleDeleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId))
  }

  const getColorLegendData = () => {
    switch (colorMode) {
      case "sourceType":
        return [
          { label: "Government Website", color: "#3b82f6" },
          { label: "Law Firm", color: "#dc2626" },
          { label: "News Article", color: "#059669" },
          { label: "NGO", color: "#7c3aed" },
        ]
      case "country":
        const visibleCountries = [...new Set(filteredNodes.map((node) => node.country))]
        const countryColors = {
          USA: "#dc2626",
          Germany: "#000000",
          Canada: "#dc2626",
          Japan: "#dc2626",
          France: "#3b82f6",
          Luxembourg: "#3b82f6",
          Mexico: "#059669",
          "South Korea": "#f59e0b",
          Australia: "#7c3aed",
        }
        return visibleCountries.map((country) => ({
          label: country,
          color: countryColors[country as keyof typeof countryColors] || "#6b7280",
        }))
      case "continent":
        return [
          { label: "North America", color: "#dc2626" },
          { label: "European Union", color: "#3b82f6" },
          { label: "Asia", color: "#f59e0b" },
          { label: "Oceania", color: "#7c3aed" },
        ]
      case "similarityRange":
        return [
          { label: "Low (0-33%)", color: "#dc2626" },
          { label: "Medium (34-66%)", color: "#f59e0b" },
          { label: "High (67-100%)", color: "#059669" },
        ]
      default:
        return []
    }
  }

  const toggleExpandedContinent = (continent: string) => {
    setExpandedContinents((prev) =>
      prev.includes(continent) ? prev.filter((c) => c !== continent) : [...prev, continent],
    )
  }

  const continentCountries = {
    "North America": ["USA", "Canada", "Mexico"],
    Europe: ["Germany", "France", "Luxembourg"],
    Asia: ["Japan", "South Korea"],
    Oceania: ["Australia"],
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-96 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-sidebar-foreground mb-2">Graph Explorer</h1>
            <p className="text-sm text-sidebar-foreground/70">Search and filter network connections</p>
          </div>

          <div className="space-y-4 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
              <Label className="text-sidebar-foreground font-medium text-base">Search Content</Label>
              <button
                className={`p-1 rounded transition-all duration-200 ${
                  hasApiKey
                    ? "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    : "text-gray-400 opacity-50 cursor-not-allowed"
                }`}
                onClick={hasApiKey ? handleExpandQuery : undefined}
                title={hasApiKey ? "Expand search with AI" : "AI expansion unavailable - add API key"}
                disabled={!hasApiKey}
              >
                ✨
              </button>
            </div>

            {/* Search Nodes */}
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Ask about AI regulations...."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                  className="pr-12 py-3 min-h-[4rem] max-h-[8rem] text-base bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 resize-none transition-all duration-200 ease-out overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-2"
                  style={{
                    height: "auto",
                    minHeight: "4rem",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = "auto"
                    target.style.height = Math.min(target.scrollHeight, 8 * 24) + "px"
                  }}
                />

                {/* Search history dropdown removed */}
              </div>

              {searchStatus && <div className="text-sm text-sidebar-foreground/70 px-2">{searchStatus}</div>}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">Limit</Label>
                  <Input
                    type="number"
                    value={topResults}
                    onChange={(e) => setTopResults(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="w-16 h-8 text-center bg-sidebar-accent/10 border-sidebar-border text-sidebar-foreground"
                    min="1"
                    max="100"
                  />
                  <span className="text-xs text-sidebar-foreground/50">nodes</span>
                </div>

                <Button
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    searchTerm.trim() && hasSearched
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700"
                      : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
                  }`}
                  onClick={searchTerm.trim() && hasSearched ? handleClearSearch : handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : searchTerm.trim() && hasSearched ? (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <Search className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Data Filters */}
          <div className="rounded-lg p-4 space-y-4 bg-white">
            <Label className="text-sidebar-foreground font-medium text-base">Data Filters</Label>

            {/* Similarity Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-black" />
                <Label className="text-sidebar-foreground font-medium text-sm">Similarity Distribution</Label>
              </div>

              <SimilarityHistogram
                searchTerm={searchTerm}
                filteredNodes={filteredNodes}
                hasSearched={hasSearched}
                calculateSimilarity={calculateSimilarity}
                selectedSimilarityRange={selectedSimilarityRange}
                onSimilarityRangeClick={handleSimilarityRangeClick}
              />
            </div>

            {/* Geographic Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-sidebar-foreground" />
                <Label className="text-sidebar-foreground font-medium text-sm">Geographic</Label>
              </div>
              <div className="space-y-2">
                {continents.map((continent) => {
                  const isSelected = selectedContinents.includes(continent)
                  const isExpanded = expandedContinents.includes(continent)
                  const countriesInContinent = continentCountries[continent as keyof typeof continentCountries] || []

                  return (
                    <div key={continent} className="space-y-1">
                      {/* Continent button */}
                      <div className="flex items-center gap-2">
                        {/* Updated continent badges to use consistent color scheme */}
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors flex-1 justify-start ${
                            isSelected
                              ? "bg-[#a855f7] text-white hover:bg-[#9333ea]"
                              : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                          }`}
                          onClick={() => toggleContinent(continent)}
                        >
                          {continent} {isSelected && "✓"}
                        </Badge>
                        {isSelected && (
                          <button
                            onClick={() => toggleExpandedContinent(continent)}
                            className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors p-1"
                          >
                            <span
                              className={`inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            >
                              ▼
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Expanded country list */}
                      {isSelected && isExpanded && (
                        <div className="ml-4 space-y-1">
                          {/* Updated country badges to use neutral gray colors */}
                          {countriesInContinent.map((country) => (
                            <Badge
                              key={country}
                              variant={selectedCountries.includes(country) ? "default" : "outline"}
                              className={`cursor-pointer transition-colors text-xs ${
                                selectedCountries.includes(country)
                                  ? "bg-[#a855f7] text-white hover:bg-[#9333ea]"
                                  : "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                              }`}
                              onClick={() => toggleCountry(country)}
                            >
                              {country}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Source Type Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-sidebar-foreground" />
                <Label className="text-sidebar-foreground font-medium text-sm">Source Type Filters</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Updated source type badges to use gray for inactive states */}
                {sourceTypes.map((sourceType) => (
                  <Badge
                    key={sourceType}
                    variant={selectedSourceTypes.includes(sourceType) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedSourceTypes.includes(sourceType)
                        ? "bg-[#a855f7] text-white hover:bg-[#9333ea]"
                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => toggleSourceType(sourceType)}
                  >
                    {sourceType}
                  </Badge>
                ))}
              </div>
            </div>

            <Card className="p-4 bg-card border-sidebar-border">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-card-foreground/70">Visible Nodes:</span>
                  <span className="font-medium text-card-foreground">{filteredNodes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-card-foreground/70">Visible Links:</span>
                  <span className="font-medium text-card-foreground">{filteredLinks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-card-foreground/70">Highlighted:</span>
                  <span className="font-medium text-card-foreground">{highlightedNodes.length}</span>
                </div>
                {expandedNodes.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-card-foreground/70">Expanded:</span>
                    <span className="font-medium text-card-foreground">{expandedNodes.length}</span>
                  </div>
                )}
              </div>
            </Card>

            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </div>

          {/* Layout & Meta */}
          <div className="rounded-lg p-4 space-y-4 bg-white">
            <Label className="text-sidebar-foreground font-medium text-base">Layout & Meta</Label>

            {/* Layout Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-sidebar-foreground" />
                <Label className="text-sm font-medium text-sidebar-foreground">Layout</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => reorganizeLayoutRef.current?.()} variant="outline" size="sm" className="flex-1">
                  Radial
                </Button>
                <Button onClick={() => arrangeAsTreeRef.current?.()} variant="outline" size="sm" className="flex-1">
                  Tree
                </Button>
              </div>
            </div>

            {/* Color by */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">Color by:</Label>
              <select
                value={colorMode}
                onChange={(e) => setColorMode(e.target.value as "sourceType" | "continent" | "similarityRange")}
                className="flex-1 h-8 px-3 bg-sidebar-accent/10 border border-sidebar-border rounded-md text-sm text-sidebar-foreground"
              >
                <option value="sourceType">Source Type</option>
                <option value="continent">Continent</option>
                <option value="similarityRange">Similarity Range</option>
              </select>
            </div>

            {/* Size by */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-sidebar-foreground/70 whitespace-nowrap">Size by:</Label>
              <select
                value={nodeSizeMode}
                onChange={(e) =>
                  setNodeSizeMode(e.target.value as "none" | "contentLength" | "summaryLength" | "similarity")
                }
                className="flex-1 h-8 px-3 bg-sidebar-accent/10 border border-sidebar-border rounded-md text-sm text-sidebar-foreground"
              >
                <option value="none">None</option>
                <option value="contentLength">Content Length</option>
                <option value="summaryLength">Summary Length</option>
                <option value="similarity">Similarity</option>
              </select>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Label htmlFor="show-labels" className="text-sm">
                    Show Labels
                  </Label>
                </div>
                <Switch id="show-labels" checked={showLabels} onCheckedChange={setShowLabels} />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-200">
              <Label className="text-sidebar-foreground font-medium text-sm">AI Configuration</Label>
              <div className="space-y-2">
                <Label htmlFor="api-key" className="text-xs text-gray-600">
                  OpenAI API Key
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="text-xs bg-sidebar-accent/10 border-sidebar-border"
                />
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${apiKey ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-xs text-gray-500">{apiKey ? "Connected" : "No API key"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="flex-1 relative">
        <NetworkGraph
          nodes={filteredNodes}
          links={filteredLinks}
          highlightedNodes={highlightedNodes}
          highlightedLinks={highlightedLinks}
          showLabels={showLabels}
          onNodeSelection={handleNodeSelection}
          selectedNodes={selectedNodes}
          expandedNodes={expandedNodes}
          onNodeExpand={onNodeExpand}
          layoutType={layoutType}
          onReorganizeLayout={reorganizeLayoutRef}
          onArrangeAsTree={arrangeAsTreeRef}
        />

        <div className="absolute top-4 left-4 space-y-4 pointer-events-none">
          {/* Color Legend */}
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Color by:{" "}
              {colorMode === "sourceType"
                ? "Source Type"
                : colorMode === "continent"
                  ? "Continent"
                  : colorMode === "similarityRange"
                    ? "Similarity Range"
                    : "Country"}
            </div>
            <div className="space-y-1">
              {getColorLegendData().map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Size Legend */}
          {nodeSizeMode !== "none" && (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Size by:{" "}
                {nodeSizeMode === "contentLength"
                  ? "Content Length"
                  : nodeSizeMode === "summaryLength"
                    ? "Summary Length"
                    : "Similarity"}
              </div>
              <div className="space-y-1">
                {nodeSizeMode === "contentLength" && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Small (0-30 chars)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Medium (30-60 chars)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Large (60+ chars)</span>
                    </div>
                  </>
                )}
                {nodeSizeMode === "summaryLength" && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Small (0-15 chars)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Medium (15-25 chars)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Large (25+ chars)</span>
                    </div>
                  </>
                )}
                {nodeSizeMode === "similarity" && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Low (0-30%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Medium (30-70%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">High (70-100%)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={`${rightPanelExpanded ? "absolute right-0 top-0 left-96 z-10" : "w-80"} bg-sidebar border-l border-sidebar-border overflow-y-auto transition-all duration-300 flex flex-col`}
      >
        {/* Expand/Collapse Button */}
        <div className="flex justify-start p-2 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
            className="h-6 px-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            {rightPanelExpanded ? "»" : "«"}
          </Button>
        </div>

        <div className="p-6 flex-1">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-2xl font-bold text-sidebar-foreground">Analysis Workspace</h3>
                <p className="text-sm text-sidebar-foreground/70 mt-1">Generate insights from selected nodes</p>
              </div>
            </div>

            {/* Context Management */}
            <div className={rightPanelExpanded ? "space-y-4" : "space-y-4"}>
              <h4 className="text-lg font-semibold text-sidebar-foreground border-b border-sidebar-border pb-2">
                Context Management
              </h4>

              <div className={rightPanelExpanded ? "flex gap-4" : "space-y-4"}>
                {/* Character Context Limit */}
                <div className={`bg-muted/20 rounded p-3 ${rightPanelExpanded ? "flex-1" : ""}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sidebar-foreground/70">
                      Character Limit:{" "}
                      {selectedNodesSummary.nodes
                        .reduce((total, node) => total + (node.summary?.length || 0), 0)
                        .toLocaleString()}
                      /20,000
                    </span>
                    {selectedNodesSummary.nodes.reduce((total, node) => total + (node.summary?.length || 0), 0) >
                      20000 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">Over limit</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Nodes */}
                <div className={`space-y-2 ${rightPanelExpanded ? "flex-1" : ""}`}>
                  <button
                    onClick={() => setShowActiveNodes(!showActiveNodes)}
                    className="w-full flex items-center justify-between p-2 hover:bg-muted/50 rounded transition-colors"
                  >
                    <Label className="text-sm font-medium text-sidebar-foreground/70">
                      Selected Nodes ({selectedNodesSummary.count})
                    </Label>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        showActiveNodes ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showActiveNodes && (
                    <div className="bg-muted/20 rounded p-2 max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-muted-foreground/20">
                            <th className="text-left py-1 font-medium text-muted-foreground">Node</th>
                            <th className="text-left py-1 font-medium text-muted-foreground">Content</th>
                            <th className="text-right py-1 font-medium text-muted-foreground">Chars</th>
                            <th className="w-6"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedNodesSummary.allSelectedNodes.map((node) => (
                            <tr key={node.id} className="hover:bg-muted/30">
                              <td className="py-1 pr-2 truncate max-w-0">
                                <span className="font-medium">{node.label}</span>
                              </td>
                              <td className="py-1 pr-2 text-muted-foreground">{node.type}</td>
                              <td className="py-1 pr-2 text-right text-muted-foreground/60">
                                {(node.summary?.length || 0).toLocaleString()}
                              </td>
                              <td className="py-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeNodeFromSelection(node.id)}
                                  className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                                >
                                  ×
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis */}
            {selectedNodes.length > 0 && (
              <Analysis
                nodes={selectedNodesSummary.nodes}
                textAnalysis={selectedNodesSummary.textAnalysis}
                themeAnalysis={selectedNodesSummary.themeAnalysis}
              />
            )}

            {/* Chat Input Interface */}
            <div className="space-y-6">
              <div className="border-t border-sidebar-border pt-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-6">What would you like to know?</h4>

                <div className="flex flex-wrap gap-3 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPill("Summary")
                      const prompt =
                        selectedNodes.length > 0
                          ? "Provide a comprehensive summary of the selected network nodes, highlighting their key themes and relationships."
                          : "Provide an overview of the entire network structure and main components."
                      setChatInput(prompt)
                      setPlaceholder("What key points should I summarize from the network?")
                    }}
                    className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      selectedPill === "Summary"
                        ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25"
                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                    disabled={isThinking}
                  >
                    Summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPill("Business Impact")
                      const prompt =
                        selectedNodes.length > 0
                          ? "Analyze the business impact and implications of the selected network nodes."
                          : "Analyze the overall business impact represented in this network."
                      setChatInput(prompt)
                      setPlaceholder("How might this network configuration affect business operations?")
                    }}
                    className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      selectedPill === "Business Impact"
                        ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25"
                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                    disabled={isThinking}
                  >
                    Business Impact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPill("Upcoming Changes")
                      const prompt =
                        selectedNodes.length > 0
                          ? "Identify potential upcoming changes or trends based on the selected network nodes."
                          : "Identify the overall business impact represented in this network."
                      setChatInput(prompt)
                      setPlaceholder("What changes are planned and what's their impact?")
                    }}
                    className={`rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      selectedPill === "Upcoming Changes"
                        ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-lg shadow-purple-500/25"
                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                    disabled={isThinking}
                  >
                    Upcoming Changes
                  </Button>
                </div>

                <div className="relative mb-6">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 pr-16 min-h-[120px] resize-none rounded-xl text-base leading-relaxed transition-all duration-200 focus:border-[#7c3aed] focus:ring-4 focus:ring-purple-500/10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        handleSendMessage()
                      }
                      if (e.key === "Escape" && isThinking) {
                        setIsThinking(false)
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className={`absolute right-3 bottom-3 h-10 w-10 p-0 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isThinking ? "animate-spin" : "hover:rotate-12"
                    }`}
                    onClick={() => handleSendMessage()}
                    disabled={!chatInput.trim()}
                  >
                    {isThinking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "→"
                    )}
                  </Button>
                </div>

                {isThinking && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-sidebar-accent/10 rounded-xl border border-sidebar-border shadow-sm px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-sidebar-foreground/70 text-sm italic">Thinking</span>
                        <span className="text-sidebar-foreground/70 text-sm">
                          <span className="inline-block animate-[dots_1.5s_ease-in-out_infinite]">...</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {conversations.length > 0 && (
                  <div className="space-y-6">
                    {/* Updated analysis conversation buttons to use consistent purple theme */}
                    {conversations
                      .slice()
                      .reverse()
                      .map((conversation, index) => (
                        <div key={conversation.id} className="space-y-4">
                          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
                            <button
                              onClick={() => handleDeleteConversation(conversation.id)}
                              className="absolute top-3 right-3 p-1 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/20 rounded transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>

                            {/* Time */}
                            <div className="mb-4">
                              <span className="text-xs text-gray-500 font-medium">
                                Time: {conversation.timestamp.toLocaleTimeString()}
                              </span>
                            </div>

                            {/* Prompt Section */}
                            <div className="mb-4">
                              <div className="text-gray-800 leading-relaxed text-base rounded-lg p-3 bg-slate-100">
                                "{conversation.prompt}"
                              </div>
                            </div>

                            {/* Analysis Section */}
                            <div className="mb-4">
                              <div className="text-gray-800 leading-relaxed text-base">{conversation.response}</div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `Prompt: ${conversation.prompt}\n\nAnalysis: ${conversation.response}`,
                                  )
                                }}
                                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(conversation.id, "up")}
                                className={
                                  conversation.feedback === "up"
                                    ? "text-gray-800 bg-gray-100"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                }
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                  />
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFeedback(conversation.id, "down")}
                                className={
                                  conversation.feedback === "down"
                                    ? "text-gray-800 bg-gray-100"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                }
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412-.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2-2h-2.5"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
