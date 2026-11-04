import type { ResourceItem } from "@/lib/types";
import { isCuratedResourceUrl, isStubCopy, sourcePill } from "@/lib/resources";
import { resourceTypeLabel } from "@/lib/student-format";

export function resourceKey(item: Pick<ResourceItem, "title" | "url" | "searchQuery">) {
  return `${item.title}::${item.url ?? ""}::${item.searchQuery}`;
}

function showable(item: ResourceItem) {
  return Boolean(
    item.url &&
      item.verified &&
      isCuratedResourceUrl(item.url, item.type) &&
      !isStubCopy(item.title) &&
      !isStubCopy(item.why),
  );
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
  const visible = items.filter(showable);
  if (visible.length === 0) return null;
  return (
    <div>
      {visible.map((item, index) => {
        const key = resourceKey(item);
        const saved = savedKeys?.has(key) ?? false;
        return (
          <article className="card" key={`${key}-${index}`}>
            <div className="row">
              <span className="type">{resourceTypeLabel(item.type)}</span>
              <span className="ok">Curated</span>
            </div>
            <h3 style={{ margin: "8px 0 2px" }}>{item.title}</h3>
            <p className="meta">
              <span className="chip" style={{ padding: "2px 8px", fontSize: 12, marginRight: 6 }}>
                {sourcePill(item.url ?? "")}
              </span>
              {item.source}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 14 }}>{item.why}</p>
            <div className="row" style={{ marginTop: 10 }}>
              <a className="tc-link" href={item.url ?? undefined} target="_blank" rel="noreferrer">
                Open
              </a>
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
