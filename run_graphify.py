import os
import sys
import json
from pathlib import Path
from graphify.detect import detect
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from graphify.cli import export_html

def main():
    out_dir = Path("graphify-out")
    out_dir.mkdir(exist_ok=True)

    with open(out_dir / ".graphify_python", "w", encoding="utf-8") as f:
        f.write(sys.executable)
    with open(out_dir / ".graphify_root", "w", encoding="utf-8") as f:
        f.write(str(Path(".").resolve()))

    print("Step 1: Detecting files...")
    det = detect(Path("."))
    with open(out_dir / ".graphify_detect.json", "w", encoding="utf-8") as f:
        json.dump(det, f, ensure_ascii=False, indent=2)

    print(f"Detected {det.get('total_files', 0)} files.")

    print("Step 2: AST Extraction...")
    code_files = []
    for f in det.get("files", {}).get("code", []):
        p = Path(f)
        if p.is_dir():
            code_files.extend(collect_files(p))
        else:
            code_files.append(p)

    if code_files:
        ast_res = extract(code_files, cache_root=Path("."))
    else:
        ast_res = {"nodes": [], "edges": [], "input_tokens": 0, "output_tokens": 0}

    with open(out_dir / ".graphify_ast.json", "w", encoding="utf-8") as f:
        json.dump(ast_res, f, ensure_ascii=False, indent=2)

    # For semantic extraction, since code-only or basic docs, create empty semantic if not existing
    sem_res = {"nodes": [], "edges": [], "hyperedges": [], "input_tokens": 0, "output_tokens": 0}
    with open(out_dir / ".graphify_semantic.json", "w", encoding="utf-8") as f:
        json.dump(sem_res, f, ensure_ascii=False, indent=2)

    # Merge AST + Semantic
    seen = {n["id"] for n in ast_res.get("nodes", [])}
    merged_nodes = list(ast_res.get("nodes", []))
    for n in sem_res.get("nodes", []):
        if n["id"] not in seen:
            merged_nodes.append(n)
            seen.add(n["id"])

    merged_edges = ast_res.get("edges", []) + sem_res.get("edges", [])
    merged_extract = {
        "nodes": merged_nodes,
        "edges": merged_edges,
        "hyperedges": [],
        "input_tokens": 0,
        "output_tokens": 0
    }
    with open(out_dir / ".graphify_extract.json", "w", encoding="utf-8") as f:
        json.dump(merged_extract, f, ensure_ascii=False, indent=2)

    print("Step 3: Building graph and clustering...")
    G = build_from_json(merged_extract, root=".", directed=False)
    if G.number_of_nodes() == 0:
        print("Warning: Empty graph")
        return

    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    labels = {cid: f"Community {cid}" for cid in communities}
    questions = suggest_questions(G, communities, labels)

    to_json(G, communities, "graphify-out/graph.json")

    report = generate(G, communities, cohesion, labels, gods, surprises, det, {"input":0, "output":0}, ".", suggested_questions=questions)
    with open(out_dir / "GRAPH_REPORT.md", "w", encoding="utf-8") as f:
        f.write(report)

    labels_map = {str(k): v for k, v in labels.items()}
    with open(out_dir / ".graphify_labels.json", "w", encoding="utf-8") as f:
        json.dump(labels_map, f, ensure_ascii=False, indent=2)

    print("Step 4: Exporting HTML visualization...")
    try:
        export_html(graph_file="graphify-out/graph.json", out_file="graphify-out/graph.html")
    except Exception as e:
        print(f"HTML Export note: {e}")

    print("Graphify pipeline complete!")

if __name__ == "__main__":
    main()
