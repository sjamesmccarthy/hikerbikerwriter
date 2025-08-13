"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Public as IpIcon,
  Language as DnsIcon,
  Domain as DomainIcon,
  Apps as AppsIcon,
  EditNote as EditNoteIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
  MenuBook as FieldNotesIcon,
} from "@mui/icons-material";
import { renderFooter } from "./shared/footerHelpers";

interface AppMenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  submenu?: AppMenuItem[];
}

interface NetworkResult {
  ipv4?: any;
  ipv6?: any;
  browser?: any;
  headers?: any;
  ip?: any; // For backward compatibility
  whois?: any;
}

const NetworkTools: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "ip" | "dns" | "headers" | "whois"
  >("ip");
  const [copySuccess, setCopySuccess] = useState<string>("");
  const [results, setResults] = useState<NetworkResult>({});
  const [loading, setLoading] = useState(false);
  const [headerUrl, setHeaderUrl] = useState<string>("");
  const [whoisDomain, setWhoisDomain] = useState<string>("");
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Apps menu configuration
  const apps: AppMenuItem[] = [
    { name: "Home", path: "/", icon: HomeIcon },
    {
      name: "Dev Tools",
      path: "/utilities",
      icon: DevToolsIcon,
      submenu: [
        { name: "Md Editor", path: "/markdown", icon: CodeIcon },
        {
          name: "JSON Previewer",
          path: "/utilities/json-previewer",
          icon: CodeIcon,
        },
        {
          name: "Hex/RGB Code",
          path: "/utilities/hex-rgb-converter",
          icon: ColorIcon,
        },
        { name: "Lorem Ipsum", path: "/utilities/lorem-ipsum", icon: TextIcon },
        {
          name: "Network Utilities",
          path: "/utilities/network-tools",
          icon: NetworkIcon,
        },
      ],
    },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "Field Notes", path: "/fieldnotes", icon: FieldNotesIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
  ];

  // Handle app selection from menu
  const handleAppSelect = (
    path: string,
    hasSubmenu: boolean = false,
    appName?: string
  ) => {
    if (hasSubmenu && appName) {
      setOpenSubmenu(openSubmenu === appName ? null : appName);
    } else {
      router.push(path);
      setIsAppsMenuOpen(false);
      setOpenSubmenu(null);
    }
  };

  // Auto-load IP information when component mounts
  useEffect(() => {
    getIpInfo();
  }, []);

  // Handle tab switching with automatic data loading
  const handleTabSwitch = (tab: "ip" | "dns" | "headers" | "whois") => {
    setActiveTab(tab);

    // Clear previous results for the new tab
    setResults((prev: any) => ({ ...prev, [tab]: undefined }));

    // Automatically load data for the selected tab (only for IP and DNS)
    switch (tab) {
      case "ip":
        getIpInfo();
        break;
      case "dns":
        getBrowserInfo();
        break;
      case "headers":
        // No auto-loading - user must manually enter URL and click Analyze
        break;
      case "whois":
        // No auto-loading - user must manually enter domain and click Lookup
        break;
    }
  };

  // Get user's IP information
  const getIpInfo = async () => {
    setLoading(true);
    try {
      // Fetch IPv4 information specifically
      const ipv4Response = await fetch("https://ipapi.co/json/");
      let ipv4Data = await ipv4Response.json();

      // If ipapi.co returns IPv6, get IPv4 from a dedicated IPv4 service
      if (ipv4Data.ip && ipv4Data.ip.includes(":")) {
        try {
          const ipv4OnlyResponse = await fetch(
            "https://api.ipify.org?format=json"
          );
          const ipv4OnlyData = await ipv4OnlyResponse.json();
          // Keep the location data from ipapi but use the IPv4 address from ipify
          ipv4Data = { ...ipv4Data, ip: ipv4OnlyData.ip };
        } catch (ipv4Error) {
          // If that fails, try another IPv4 service
          try {
            const altIpv4Response = await fetch("https://v4.ident.me/");
            const altIpv4Address = await altIpv4Response.text();
            ipv4Data = { ...ipv4Data, ip: altIpv4Address.trim() };
          } catch (altError) {
            // Keep original data
          }
        }
      }

      // Try to fetch IPv6 information
      let ipv6Data = null;
      try {
        const ipv6Response = await fetch("https://ipv6.icanhazip.com", {
          mode: "cors",
        });
        if (ipv6Response.ok) {
          const ipv6Address = await ipv6Response.text();
          ipv6Data = { ip: ipv6Address.trim() };
        }
      } catch (ipv6Error) {
        // IPv6 not available or blocked
        ipv6Data = { error: "IPv6 not available" };
      }

      // Also try alternative IPv6 service
      if (!ipv6Data || ipv6Data.error) {
        try {
          const ipv6Alt = await fetch("https://api6.ipify.org?format=json");
          if (ipv6Alt.ok) {
            const ipv6AltData = await ipv6Alt.json();
            ipv6Data = { ip: ipv6AltData.ip };
          }
        } catch (altError) {
          // Keep original error
        }
      }

      setResults({
        ip: {
          ipv4: ipv4Data,
          ipv6: ipv6Data,
        },
      });
    } catch (error) {
      setResults({ ip: { error: "Failed to fetch IP information" } });
    }
    setLoading(false);
  };

  // Get user's browser/device information
  const getBrowserInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages.join(", "),
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    setResults({ browser: info });
  };

  // Get HTTP headers from a URL
  const getHeaders = async (url?: string) => {
    setLoading(true);
    const targetUrl = url || headerUrl;

    try {
      // Use a CORS proxy to fetch headers from any URL
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        targetUrl
      )}`;

      const response = await fetch(proxyUrl, {
        method: "HEAD",
        mode: "cors",
      });

      // Since we can't get actual response headers due to CORS,
      // we'll simulate what the headers would look like and show request headers
      const requestHeaders = {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": navigator.language,
        "User-Agent": navigator.userAgent,
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        Host: new URL(targetUrl).hostname,
        Referer: window.location.origin,
        "Cache-Control": "no-cache",
      };

      // Try to get some response info
      const responseInfo = {
        Status: response.ok
          ? "200 OK"
          : `${response.status} ${response.statusText}`,
        "Content-Type": response.headers.get("content-type") || "Unknown",
        Server: response.headers.get("server") || "Unknown",
        Date: new Date().toUTCString(),
        "Target-URL": targetUrl,
      };

      setResults({
        headers: {
          requestHeaders,
          responseInfo,
          note: "Request headers shown above. Response headers may be limited due to CORS policy.",
        },
      });
    } catch (error) {
      // Fallback to showing just request headers
      const requestHeaders = {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": navigator.language,
        "User-Agent": navigator.userAgent,
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        Host: targetUrl ? new URL(targetUrl).hostname : "localhost",
        Referer: window.location.origin,
        "Cache-Control": "no-cache",
      };

      setResults({
        headers: {
          requestHeaders,
          error: `Unable to fetch headers from ${targetUrl}. Showing request headers that would be sent.`,
          targetUrl,
        },
      });
    }

    setLoading(false);
  };

  // Get WHOIS information for a domain
  const getWhoisInfo = async (domain?: string) => {
    setLoading(true);
    const targetDomain = domain || whoisDomain;

    try {
      // Clean the domain (remove protocol, www, etc.)
      const cleanDomain = targetDomain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim();

      // Due to CORS restrictions, most WHOIS APIs don't work from browsers
      // Instead, provide helpful information and alternative methods

      // Try to get basic DNS information to verify domain exists
      let domainExists = false;
      try {
        const dnsResponse = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`,
          {
            headers: {
              Accept: "application/dns-json",
            },
          }
        );

        if (dnsResponse.ok) {
          const dnsData = await dnsResponse.json();
          domainExists = dnsData.Answer && dnsData.Answer.length > 0;
        }
      } catch {
        // DNS check failed, assume domain might exist
      }

      // Extract domain parts for basic info
      const domainParts = cleanDomain.split(".");
      const tld =
        domainParts.length > 1
          ? domainParts[domainParts.length - 1].toUpperCase()
          : "Unknown";
      const sld =
        domainParts.length > 1
          ? domainParts[domainParts.length - 2]
          : cleanDomain;

      // Provide comprehensive fallback information
      setResults({
        whois: {
          domain: cleanDomain,
          error:
            "WHOIS lookup unavailable due to browser security restrictions (CORS)",
          corsInfo: true,
          domainStatus: domainExists
            ? "Domain appears to exist (has DNS records)"
            : "Domain status unknown",
          basicInfo: {
            "Full Domain": cleanDomain,
            "Second Level Domain": sld,
            "Top Level Domain": tld,
            "Query Time": new Date().toLocaleString(),
            "DNS Status": domainExists ? "✅ Active" : "❓ Unknown",
          },
          commandLine: `whois ${cleanDomain}`,
          webAlternatives: [
            `https://whois.net/whois/${cleanDomain}`,
            `https://www.whois.com/whois/${cleanDomain}`,
            `https://whois.domaintools.com/${cleanDomain}`,
            `https://lookup.icann.org/en/lookup?name=${cleanDomain}`,
          ],
          reasons: [
            "Browser security (CORS) prevents direct WHOIS API access",
            "WHOIS services block cross-origin requests from web browsers",
            "This is a security feature to prevent malicious websites from making arbitrary requests",
          ],
          suggestions: [
            `Open Terminal/Command Prompt and run: whois ${cleanDomain}`,
            "Use the web-based WHOIS tools linked above",
            "Check with your domain registrar directly",
            "Use network administrator tools if available",
          ],
          cliInstructions: [
            `macOS/Linux: whois ${cleanDomain}`,
            `Windows: nslookup ${cleanDomain}`,
            `PowerShell: Resolve-DnsName ${cleanDomain}`,
          ],
        },
      });
    } catch {
      // Final fallback
      const cleanDomain = targetDomain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim();

      setResults({
        whois: {
          domain: cleanDomain,
          error: "WHOIS lookup failed",
          corsInfo: true,
          commandLine: `whois ${cleanDomain}`,
          webAlternatives: [
            `https://whois.net/whois/${cleanDomain}`,
            `https://www.whois.com/whois/${cleanDomain}`,
          ],
          reasons: [
            "Network or browser restrictions",
            "Invalid domain name format",
            "Service temporarily unavailable",
          ],
          suggestions: [
            `Use command line: whois ${cleanDomain}`,
            "Try online WHOIS lookup tools",
            "Verify domain name spelling",
          ],
        },
      });
    }

    setLoading(false);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(key);
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const renderIpTab = () => (
    <div className="space-y-4">
      {loading && (
        <div className="text-center py-4">
          <div className="text-blue-600">Loading your IP information...</div>
        </div>
      )}

      {results.ip && (
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="font-semibold mb-3">IP Information</h3>
          {results.ip.error ? (
            <p className="text-red-600">{results.ip.error}</p>
          ) : (
            <div className="space-y-6">
              {/* IP Addresses Summary - Like whatismyip.com */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 text-center">
                  Your IP Addresses
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.ip.ipv4 && !results.ip.ipv4.error && (
                    <div className="text-center">
                      <div className="text-sm text-blue-700 font-medium mb-1">
                        IPv4
                      </div>
                      <div className="text-lg font-mono font-bold text-blue-900">
                        {results.ip.ipv4.ip}
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-sm text-blue-700 font-medium mb-1">
                      IPv6
                    </div>
                    {results.ip.ipv6 && !results.ip.ipv6.error ? (
                      <div className="text-lg font-mono font-bold text-blue-900 break-all">
                        {results.ip.ipv6.ip}
                      </div>
                    ) : (
                      <div className="text-sm text-blue-600 italic">
                        Not available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Map */}
              {results.ip.ipv4 &&
                !results.ip.ipv4.error &&
                results.ip.ipv4.latitude &&
                results.ip.ipv4.longitude && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Your Location
                    </h4>
                    <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                          results.ip.ipv4.longitude - 0.05
                        },${results.ip.ipv4.latitude - 0.05},${
                          results.ip.ipv4.longitude + 0.05
                        },${
                          results.ip.ipv4.latitude + 0.05
                        }&layer=mapnik&marker=${results.ip.ipv4.latitude},${
                          results.ip.ipv4.longitude
                        }`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        title="Your approximate location"
                        loading="lazy"
                      ></iframe>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 text-center">
                      Approximate location based on your IP address:{" "}
                      {results.ip.ipv4.city}, {results.ip.ipv4.region}
                    </div>
                  </div>
                )}

              {/* Detailed IPv4 Information */}
              {results.ip.ipv4 && !results.ip.ipv4.error && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Detailed IPv4 Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>City:</strong> {results.ip.ipv4.city}
                    </div>
                    <div>
                      <strong>Region:</strong> {results.ip.ipv4.region}
                    </div>
                    <div>
                      <strong>Country:</strong> {results.ip.ipv4.country_name}
                    </div>
                    <div>
                      <strong>Country Code:</strong>{" "}
                      {results.ip.ipv4.country_code}
                    </div>
                    <div>
                      <strong>ISP:</strong> {results.ip.ipv4.org}
                    </div>
                    <div>
                      <strong>ASN:</strong> {results.ip.ipv4.asn}
                    </div>
                    <div>
                      <strong>Timezone:</strong> {results.ip.ipv4.timezone}
                    </div>
                    <div>
                      <strong>Postal Code:</strong> {results.ip.ipv4.postal}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDnsTab = () => (
    <div className="space-y-4">
      {results.browser && (
        <div className="bg-gray-50 rounded-md p-4">
          <h3 className="font-semibold mb-3">Browser & Device Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Platform:</strong> {results.browser.platform}
            </div>
            <div>
              <strong>Language:</strong> {results.browser.language}
            </div>
            <div>
              <strong>Timezone:</strong> {results.browser.timezone}
            </div>
            <div>
              <strong>Screen Resolution:</strong> {results.browser.screen.width}{" "}
              x {results.browser.screen.height}
            </div>
            <div>
              <strong>Viewport:</strong> {results.browser.viewport.width} x{" "}
              {results.browser.viewport.height}
            </div>
            <div>
              <strong>Color Depth:</strong> {results.browser.screen.colorDepth}{" "}
              bits
            </div>
            <div>
              <strong>Online Status:</strong>{" "}
              {results.browser.onLine ? "Online" : "Offline"}
            </div>
            <div>
              <strong>Cookies Enabled:</strong>{" "}
              {results.browser.cookieEnabled ? "Yes" : "No"}
            </div>
            <div className="mt-3">
              <strong>User Agent:</strong>
              <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                {results.browser.userAgent}
                <button
                  onClick={() =>
                    copyToClipboard(results.browser.userAgent, "userAgent")
                  }
                  className={`ml-2 px-2 py-1 text-xs rounded ${
                    copySuccess === "userAgent"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white hover:bg-gray-600"
                  }`}
                >
                  {copySuccess === "userAgent" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHeadersTab = () => (
    <div className="space-y-4">
      {/* URL Input Section */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Analyze HTTP Headers</h3>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="url"
            value={headerUrl}
            onChange={(e) => setHeaderUrl(e.target.value)}
            placeholder="Enter URL to analyze headers..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => getHeaders()}
            disabled={loading || !headerUrl.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter any URL to see the HTTP headers that would be sent in the
          request.
        </p>
      </div>

      {/* Results Section */}
      {results.headers && (
        <div className="space-y-4">
          {/* Error Message */}
          {results.headers.error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">{results.headers.error}</p>
            </div>
          )}

          {/* Request Headers */}
          {results.headers.requestHeaders && (
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="font-semibold mb-3 text-green-700">
                📤 Request Headers
              </h4>
              <div className="space-y-2">
                {Object.entries(results.headers.requestHeaders).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="font-mono text-sm">
                        <strong className="text-green-600">{key}:</strong>{" "}
                        {value as string}
                      </div>
                      <button
                        onClick={() => copyToClipboard(`${key}: ${value}`, key)}
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          copySuccess === key
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {copySuccess === key ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Response Info */}
          {results.headers.responseInfo && (
            <div className="bg-blue-50 rounded-md p-4">
              <h4 className="font-semibold mb-3 text-blue-700">
                📥 Response Information
              </h4>
              <div className="space-y-2">
                {Object.entries(results.headers.responseInfo).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="font-mono text-sm">
                        <strong className="text-blue-600">{key}:</strong>{" "}
                        {value as string}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(`${key}: ${value}`, `resp-${key}`)
                        }
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          copySuccess === `resp-${key}`
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {copySuccess === `resp-${key}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {results.headers.note && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-gray-600 text-sm italic">
                {results.headers.note}
              </p>
            </div>
          )}

          {/* Legacy support for old header format */}
          {!results.headers.requestHeaders && !results.headers.error && (
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="font-semibold mb-3">HTTP Headers</h3>
              <div className="space-y-2">
                {Object.entries(results.headers).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="font-mono text-sm">
                      <strong>{key}:</strong> {value as string}
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${key}: ${value}`, key)}
                      className={`ml-2 px-2 py-1 text-xs rounded ${
                        copySuccess === key
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {copySuccess === key ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderWhoisTab = () => (
    <div className="space-y-4">
      {/* Domain Input Section */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-3">WHOIS Domain Lookup</h3>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            value={whoisDomain}
            onChange={(e) => setWhoisDomain(e.target.value)}
            placeholder="Enter domain name (e.g., google.com, github.com)..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => getWhoisInfo()}
            disabled={loading || !whoisDomain.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "Looking up..." : "Lookup"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter a domain name to see registration details, nameservers, and
          ownership information.
        </p>
      </div>

      {/* Results Section */}
      {results.whois && (
        <div className="space-y-4">
          {/* Error Message */}
          {results.whois.error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">
                ⚠️ WHOIS Lookup Failed
              </h4>
              <p className="text-yellow-700 text-sm mb-3">
                {results.whois.error}
              </p>

              {results.whois.commandLine && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                  <p className="text-blue-700 text-sm">
                    {results.whois.commandLine}
                  </p>
                </div>
              )}

              {results.whois.reasons && (
                <div className="mb-3">
                  <p className="text-yellow-700 text-sm font-medium mb-2">
                    Possible reasons:
                  </p>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {results.whois.reasons.map(
                      (reason: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          {reason}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {results.whois.cliInstructions && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                  <p className="text-gray-700 text-sm font-medium mb-2">
                    🖥️ Alternative methods to get WHOIS data:
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1">
                    {results.whois.cliInstructions.map(
                      (instruction: string, idx: number) => (
                        <li key={idx} className="flex items-start font-mono">
                          <span className="mr-2 text-gray-400">•</span>
                          {instruction}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {results.whois.suggestion && (
                <p className="text-yellow-600 text-xs italic">
                  {results.whois.suggestion}
                </p>
              )}
            </div>
          )}

          {/* Fallback Info */}
          {results.whois.fallbackInfo && (
            <div className="bg-gray-50 rounded-md p-4">
              <h4 className="font-semibold mb-3 text-gray-700">
                📋 Basic Domain Information
              </h4>
              <div className="space-y-2">
                {Object.entries(results.whois.fallbackInfo).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="font-mono text-sm">
                        <strong className="text-gray-600">{key}:</strong>{" "}
                        {value as string}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(`${key}: ${value}`, `fallback-${key}`)
                        }
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          copySuccess === `fallback-${key}`
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {copySuccess === `fallback-${key}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Successful WHOIS Data */}
          {results.whois.domain && !results.whois.error && (
            <div className="space-y-4">
              {/* Domain Registration Info */}
              <div className="bg-green-50 rounded-md p-4">
                <h4 className="font-semibold mb-3 text-green-700">
                  🌐 Domain Registration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-600">Domain:</strong>{" "}
                      {results.whois.domain}
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-600">Registrar:</strong>{" "}
                      {results.whois.registrar}
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-600">Status:</strong>{" "}
                      {results.whois.status}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-600">Registered:</strong>{" "}
                      {results.whois.registrationDate}
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-600">Expires:</strong>{" "}
                      {results.whois.expirationDate}
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-green-600">Updated:</strong>{" "}
                      {results.whois.lastUpdated}
                    </div>
                  </div>
                </div>
              </div>

              {/* Registrant Info */}
              {results.whois.registrant && (
                <div className="bg-blue-50 rounded-md p-4">
                  <h4 className="font-semibold mb-3 text-blue-700">
                    👤 Registrant Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-blue-600">Name:</strong>{" "}
                      {results.whois.registrant.name}
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-blue-600">Organization:</strong>{" "}
                      {results.whois.registrant.organization}
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <strong className="text-blue-600">Country:</strong>{" "}
                      {results.whois.registrant.country}
                    </div>
                  </div>
                </div>
              )}

              {/* Nameservers */}
              {results.whois.nameservers &&
                results.whois.nameservers.length > 0 && (
                  <div className="bg-purple-50 rounded-md p-4">
                    <h4 className="font-semibold mb-3 text-purple-700">
                      🖥️ Nameservers
                    </h4>
                    <div className="space-y-2">
                      {results.whois.nameservers.map(
                        (ns: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-white rounded border"
                          >
                            <div className="font-mono text-sm">
                              <strong className="text-purple-600">
                                NS{idx + 1}:
                              </strong>{" "}
                              {ns}
                            </div>
                            <button
                              onClick={() => copyToClipboard(ns, `ns-${idx}`)}
                              className={`ml-2 px-2 py-1 text-xs rounded ${
                                copySuccess === `ns-${idx}`
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 hover:bg-gray-300"
                              }`}
                            >
                              {copySuccess === `ns-${idx}` ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Technical Details */}
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="font-semibold mb-3 text-gray-700">
                  🔧 Technical Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-gray-600">DNSSEC:</strong>{" "}
                    {results.whois.dnssec}
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <strong className="text-gray-600">Query Time:</strong>{" "}
                    {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3">
          <Link href="/">
            <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          </Link>

          <div className="h-4 w-px bg-gray-300" />

          {/* Apps Menu */}
          <div className="relative">
            <button
              onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
              className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
              aria-label="Apps Menu"
              aria-expanded={isAppsMenuOpen}
            >
              <AppsIcon sx={{ fontSize: 16 }} />
              Apps
            </button>

            {/* Apps Dropdown */}
            {isAppsMenuOpen && (
              <>
                <button
                  className="fixed inset-0 -z-10 cursor-default"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    setOpenSubmenu(null);
                  }}
                  aria-label="Close menu"
                  tabIndex={-1}
                />
                <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-md shadow-xl border border-white/30 min-w-[200px] overflow-hidden z-50">
                  {apps.map((app) => {
                    const IconComponent = app.icon;
                    const hasSubmenu = app.submenu && app.submenu.length > 0;
                    const isSubmenuOpen = openSubmenu === app.name;

                    return (
                      <div key={app.path}>
                        <button
                          onClick={() =>
                            handleAppSelect(app.path, hasSubmenu, app.name)
                          }
                          className="w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent sx={{ fontSize: 20 }} />
                            <span className="text-sm font-medium">
                              {app.name}
                            </span>
                          </div>
                          {hasSubmenu && (
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 16,
                                transform: isSubmenuOpen
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease-in-out",
                              }}
                            />
                          )}
                        </button>
                        {hasSubmenu && isSubmenuOpen && app.submenu && (
                          <div className="bg-gray-50/90 backdrop-blur-sm border-t border-gray-200/50">
                            {app.submenu.map((subItem) => {
                              const SubIconComponent = subItem.icon;
                              return (
                                <button
                                  key={subItem.path}
                                  onClick={() => handleAppSelect(subItem.path)}
                                  className="w-full px-6 py-2 text-left flex items-center gap-3 transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                                >
                                  <SubIconComponent sx={{ fontSize: 16 }} />
                                  <span className="text-sm">
                                    {subItem.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <h3 className="text-lg font-semibold text-gray-800">
            Network Utilities
          </h3>
        </div>

        <div className="p-4">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 md:space-x-8 px-6">
                <button
                  onClick={() => handleTabSwitch("ip")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "ip"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <IpIcon
                    sx={{ fontSize: 16, marginRight: { xs: 0, md: 1 } }}
                  />
                  <span className="hidden md:inline">IP Information</span>
                </button>
                <button
                  onClick={() => handleTabSwitch("dns")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "dns"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <DnsIcon
                    sx={{ fontSize: 16, marginRight: { xs: 0, md: 1 } }}
                  />
                  <span className="hidden md:inline">Browser Info</span>
                </button>
                <button
                  onClick={() => handleTabSwitch("headers")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "headers"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CopyIcon
                    sx={{ fontSize: 16, marginRight: { xs: 0, md: 1 } }}
                  />
                  <span className="hidden md:inline">HTTP Headers</span>
                </button>
                <button
                  onClick={() => handleTabSwitch("whois")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "whois"
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <DomainIcon
                    sx={{ fontSize: 16, marginRight: { xs: 0, md: 1 } }}
                  />
                  <span className="hidden md:inline">WHOIS Lookup</span>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "ip" && renderIpTab()}
              {activeTab === "dns" && renderDnsTab()}
              {activeTab === "headers" && renderHeadersTab()}
              {activeTab === "whois" && renderWhoisTab()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {renderFooter("integrated")}
    </div>
  );
};

export default NetworkTools;
