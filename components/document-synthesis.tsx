import type { DocumentSection } from "@/lib/document-sections";

export function DocumentSynthesis({ document }: { document: DocumentSection }) {
  const structured = !!document.groups?.length;
  return <div className={`document-synthesis${structured ? " document-synthesis-structured" : ""}`}>
    <span className="case-kicker">Información de la colección</span>
    {document.groups?.map(group => <section className="clinical-record-group" key={group.title}>
      <h4>{group.title}</h4>
      <dl className="clinical-record-fields">{group.fields.map(field => <div key={field.label}>
        <dt>{field.label}</dt><dd>{field.value}</dd>
      </div>)}</dl>
    </section>)}
    {structured && document.paragraphs.length > 0 && <h4 className="clinical-record-narrative">Descripción del caso</h4>}
    {document.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
  </div>;
}
