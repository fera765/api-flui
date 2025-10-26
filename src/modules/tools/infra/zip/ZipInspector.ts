/**
 * Zip Inspector
 * Valida e inspeciona arquivos ZIP de tools antes da importação
 */

import AdmZip from 'adm-zip';
import { createReadStream } from 'fs';
import { createHash } from 'crypto';

export interface ZipInspectionResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  manifest?: any;
  files?: string[];
  size?: number;
}

export class ZipInspector {
  private static MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
  private static FORBIDDEN_FILES = ['.env', '.env.local', '.env.production'];
  private static FORBIDDEN_EXTENSIONS = ['.exe', '.bat', '.sh', '.cmd', '.com'];
  private static SUSPICIOUS_PATHS = ['node_modules', '.git', '.svn'];

  /**
   * Inspeciona um arquivo ZIP
   */
  public static async inspect(zipPath: string): Promise<ZipInspectionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar tamanho do arquivo
      const stats = await import('fs').then(fs => fs.promises.stat(zipPath));
      const size = stats.size;

      if (size > this.MAX_ZIP_SIZE) {
        return {
          valid: false,
          errors: [`ZIP file too large: ${size} bytes (max: ${this.MAX_ZIP_SIZE})`],
        };
      }

      // Abrir ZIP
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      // Listar arquivos
      const files = zipEntries.map(entry => entry.entryName);

      // Verificar se manifest.json existe
      const manifestEntry = zipEntries.find(entry => entry.entryName === 'manifest.json');
      if (!manifestEntry) {
        errors.push('manifest.json not found in ZIP');
        return { valid: false, errors, files, size };
      }

      // Ler e parsear manifest
      let manifest: any;
      try {
        const manifestContent = manifestEntry.getData().toString('utf8');
        manifest = JSON.parse(manifestContent);
      } catch (error) {
        errors.push('manifest.json is not valid JSON');
        return { valid: false, errors, files, size };
      }

      // Verificar estrutura esperada
      const hasDistFolder = files.some(f => f.startsWith('dist/'));
      if (!hasDistFolder) {
        errors.push('dist/ folder not found in ZIP');
      }

      // Verificar entry point existe
      if (manifest.entry) {
        const entryExists = files.includes(manifest.entry);
        if (!entryExists) {
          errors.push(`Entry point '${manifest.entry}' not found in ZIP`);
        }
      }

      // Detectar arquivos proibidos
      for (const file of files) {
        const fileName = file.split('/').pop() || '';
        const fileExt = fileName.substring(fileName.lastIndexOf('.'));

        // Verificar arquivos proibidos
        if (this.FORBIDDEN_FILES.includes(fileName)) {
          errors.push(`Forbidden file detected: ${file}`);
        }

        // Verificar extensões proibidas
        if (this.FORBIDDEN_EXTENSIONS.includes(fileExt)) {
          errors.push(`Forbidden file extension detected: ${file}`);
        }

        // Verificar paths suspeitos
        for (const suspicious of this.SUSPICIOUS_PATHS) {
          if (file.includes(suspicious + '/')) {
            warnings.push(`Suspicious path detected: ${file}`);
          }
        }
      }

      // Verificar node_modules grande
      const nodeModulesFiles = files.filter(f => f.includes('node_modules/'));
      if (nodeModulesFiles.length > 100) {
        errors.push(`ZIP contains large node_modules (${nodeModulesFiles.length} files) - use bundled build instead`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
        manifest,
        files,
        size,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to inspect ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Extrai manifest.json sem extrair todo o ZIP
   */
  public static async extractManifest(zipPath: string): Promise<any> {
    try {
      const zip = new AdmZip(zipPath);
      const manifestEntry = zip.getEntry('manifest.json');
      
      if (!manifestEntry) {
        throw new Error('manifest.json not found');
      }

      const content = manifestEntry.getData().toString('utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to extract manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calcula hash SHA256 do ZIP para auditoria
   */
  public static async calculateHash(zipPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(zipPath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Extrai ZIP para diretório de destino
   */
  public static async extract(zipPath: string, targetDir: string): Promise<void> {
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(targetDir, true);
    } catch (error) {
      throw new Error(`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
