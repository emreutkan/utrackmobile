const { withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add networkSecurityConfig attribute to application tag
    if (!mainApplication.$) {
      mainApplication.$ = {};
    }
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    // Create the network security config file
    const projectRoot = config.modRequest.projectRoot;
    const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
    const xmlPath = path.join(xmlDir, 'network_security_config.xml');

    // Ensure directory exists
    if (!fs.existsSync(xmlDir)) {
      fs.mkdirSync(xmlDir, { recursive: true });
    }

    // Write network security config
    const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.1.7</domain>
        <domain includeSubdomains="true">api.utrack.irfanemreutkan.com</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>`;

    fs.writeFileSync(xmlPath, networkSecurityConfig);

    return config;
  });
};

module.exports = withNetworkSecurityConfig;

