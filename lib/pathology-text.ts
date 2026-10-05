import type { ScientificSection } from "./pathology-content";
import type { DocumentSection } from "./document-sections";
import type { LocalCase } from "./case-editorial";

/** Edited website content. Source documents are references, not runtime inputs. */
export type PathologyText = {
  cover?: string;
  /** Optional gallery filenames in display order, including portada.webp if desired. */
  galleryOrder?: string[];
  summary: string;
  system: string;
  documentSections: DocumentSection[];
  sections: ScientificSection[];
  localCases: LocalCase[];
  sourceCount: number;
};
