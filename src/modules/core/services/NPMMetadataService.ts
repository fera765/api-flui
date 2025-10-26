import { execSync } from 'child_process';

export interface NPMPackageMetadata {
  name: string;
  description?: string;
  version?: string;
  keywords?: string[];
  repository?: {
    type: string;
    url: string;
  };
  bin?: Record<string, string> | string;
  homepage?: string;
}

export class NPMMetadataService {
  /**
   * Fetch metadata for an NPM package
   */
  public async fetchMetadata(packageName: string): Promise<NPMPackageMetadata | null> {
    try {
      if (!packageName || packageName.trim() === '') {
        return null;
      }

      console.log(`[NPM] Fetching metadata for package: ${packageName}`);

      // Query NPM registry for package metadata
      const result = execSync(
        `npm view ${packageName} name description version keywords repository bin homepage --json 2>/dev/null || echo "null"`,
        {
          encoding: 'utf-8',
          timeout: 8000,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      const trimmed = result.trim();
      if (!trimmed || trimmed === 'null' || trimmed === '{}') {
        console.log(`[NPM] No metadata found for package: ${packageName}`);
        return null;
      }

      const data = JSON.parse(trimmed);

      // Handle case where npm returns array (multiple versions)
      const metadata = Array.isArray(data) ? data[0] : data;

      const result_metadata: NPMPackageMetadata = {
        name: metadata.name || packageName,
        description: metadata.description,
        version: metadata.version,
        keywords: metadata.keywords,
        repository: metadata.repository,
        bin: metadata.bin,
        homepage: metadata.homepage,
      };

      console.log(`[NPM] Successfully fetched metadata for: ${packageName}`);
      return result_metadata;

    } catch (error) {
      console.error(`[NPM] Error fetching metadata for ${packageName}:`, error);
      return null;
    }
  }

  /**
   * Generate a friendly name from package name
   */
  public generateFriendlyName(packageName: string): string {
    let name = packageName;

    // Remove scope (@org/name -> name)
    if (name.includes('/')) {
      name = name.split('/').pop() || name;
    }

    // Remove common prefixes
    name = name.replace(/^(server-|mcp-server-|mcp-)/, '');

    // Convert kebab-case to Title Case
    name = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return name;
  }

  /**
   * Check if package exists on NPM
   */
  public async packageExists(packageName: string): Promise<boolean> {
    try {
      const result = execSync(`npm view ${packageName} name 2>/dev/null || echo ""`, {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return result.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Suggest MCP name and description based on package
   */
  public async suggestMCPDetails(packageName: string): Promise<{
    suggestedName: string;
    suggestedDescription: string;
  }> {
    const metadata = await this.fetchMetadata(packageName);

    let suggestedName = this.generateFriendlyName(packageName);
    let suggestedDescription = 'MCP Server';

    if (metadata) {
      // Use package description if available
      if (metadata.description) {
        suggestedDescription = metadata.description;
      }

      // Enhance name with version if available
      if (metadata.version && !suggestedName.includes('MCP')) {
        suggestedName = `${suggestedName} MCP`;
      }
    }

    return {
      suggestedName,
      suggestedDescription,
    };
  }
}
