// This file will contain the logic for fetching and parsing AltStore-compatible repositories.
// The code will be based on the Swift implementation from AltSourceKit.

import { fetchJSON } from './utils.js';

class ASRepository {
    constructor(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid repository data');
        }
        this.identifier = data.identifier || '';
        this.name = data.name || '';
        this.subtitle = data.subtitle || '';
        this.description = data.description || '';
        this.website = data.website || '';
        this.iconURL = data.iconURL || '';
        this.headerURL = data.headerURL || '';
        this.tintColor = data.tintColor || '';
        this.patreonURL = data.patreonURL || '';
        this.userInfo = data.userInfo || {};
        this.apps = (data.apps || []).map(app => new App(app));
        this.featuredApps = data.featuredApps || [];
        this.news = (data.news || []).map(news => new News(news));
    }
}

class App {
    constructor(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid app data');
        }
        this.bundleIdentifier = data.bundleIdentifier || '';
        this.name = data.name || '';
        this.subtitle = data.subtitle || '';
        this.description = data.description || '';
        this.developerName = data.developerName || '';
        this.versions = (data.versions || []).map(version => new Version(version));
        this.version = data.version || '';
        this.versionDate = data.versionDate || '';
        this.versionDescription = data.versionDescription || '';
        this.downloadURL = data.downloadURL || '';
        this.localizedDescription = data.localizedDescription || '';
        this.iconURL = data.iconURL || '';
        this.tintColor = data.tintColor || '';
        this.size = data.size || 0;
        this.category = data.category || '';
        this.beta = data.beta || false;
        this.permissions = (data.permissions || []).map(permission => new Permission(permission));
        this.appPermissions = data.appPermissions ? new AppPermissions(data.appPermissions) : null;
        this.screenshots = data.screenshots || [];
        this.screenshotURLs = data.screenshotURLs || [];
    }
}

class Version {
    constructor(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid version data');
        }
        this.version = data.version || '';
        this.buildVersion = data.buildVersion || '';
        this.date = data.date || '';
        this.localizedDescription = data.localizedDescription || '';
        this.downloadURL = data.downloadURL || '';
        this.size = data.size || 0;
        this.minOSVersion = data.minOSVersion || '';
    }
}

class News {
    constructor(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid news data');
        }
        this.identifier = data.identifier || '';
        this.title = data.title || '';
        this.caption = data.caption || '';
        this.tintColor = data.tintColor || '';
        this.imageURL = data.imageURL || '';
        this.url = data.url || '';
        this.appID = data.appID || '';
        this.date = data.date || '';
        this.notify = data.notify || false;
    }
}

class Permission {
    constructor(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid permission data');
        }
        this.type = data.type || '';
        this.usageDescription = data.usageDescription || '';
    }
}

class AppPermissions {
    constructor(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid app permissions data');
        }
        this.entitlements = data.entitlements || {};
        this.privacy = data.privacy || {};
    }
}

const cache = new Map();

export async function fetchRepo(src) {
    if (cache.has(src)) {
        return cache.get(src);
    }

    const url = src.includes('://') ? src : `https://raw.githubusercontent.com/ripestore/repos/main/${src}.json`;

    try {
        const data = await fetchJSON(url);
        const repository = new ASRepository(data);
        const result = { data: repository, url };
        cache.set(src, result);
        return result;
    } catch (error) {
        console.error(`Failed to fetch or parse repo from ${url}:`, error);
        throw new Error(`Failed to load repository: ${error.message}`);
    }
}
