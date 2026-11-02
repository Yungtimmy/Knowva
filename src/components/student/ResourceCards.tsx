import type { ResourceItem } from "@/lib/types";
import { resourceTypeLabel, undouble } from "@/lib/student-format";

export function resourceKey(item: Pick<ResourceItem, "title" | "url" | "searchQuery">) {
  return `${item.title}::${item.url ?? ""}::${item.searchQuery}`;
}

export function ResourceCards({
  items,
  savedKeys,
  onSave,
}: {
  items: ResourceItem[];
  savedKeys?: ReadonlySet<string>;
  onSave?: (item: ResourceItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      {items.map((item, index) => {
        const key = resourceKey(item);
        const saved = savedKeys?.has(key) ?? false;
        return (
          <article className="card" key={`${key}-${index}`}>
            <div className="row">
              <span className="type">{resourceTypeLabel(item.type)}</span>
              <span>
                {item.role === "alternate" ? <span className="meta">Alternate · </span> : null}
                {item.verified ? <span className="ok">Checked source</span> : <span className="meta">Not a checked link</span>}
              </span>
            </div>
            <h3 style={{ margin: "8px 0 2px" }}>{undouble(item.title)}</h3>
            <p className="meta">{item.source}</p>
            <p style={{ marginTop: 6 }}>{item.why}</p>
            <div className="row" style={{ marginTop: 10 }}>
              {item.verified && item.url ? (
                <a className="tc-link" href={item.url} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : (
                <span className="meta">Search: {undouble(item.searchQuery)}</span>
              )}
              {onSave ? (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => onSave(item)}>
                  {saved ? "Saved" : "Save"}
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
