// /articlewriter — restyled onto the sakura brand ladder (legacy restyle,
// lane /articlewriter; docs/redesign-research/16-legacy-restyle.md).
//
// Product behavior is preserved: same POST to the local generator, same
// rendered HTML semantics (dangerouslySetInnerHTML — the existing trust
// boundary, kept because this lane found no separate security requirement),
// same clipboard action. The additions are the two states the plan demands
// be visible: a loading region (Skeleton + explicit text) and a failure
// alert (the old page swallowed fetch errors into console.error).
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MonoLabel, SectionHead, StatusPill } from "@/components/brand";
import "@/styles/sakura.css";
import "@/styles/ArticleWriter.css";

export const ArticleWriter = () => {
  const [product, setProduct] = useState("");
  const [articleHTML, setArticleHTML] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Generate Article";
  }, []);

  const handleGenerateArticle = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:8000/generate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product }),
      });
      if (!response.ok) {
        // A non-2xx with a JSON body used to set html_content to undefined
        // and render nothing; surface it instead of swallowing it.
        throw new Error(`request failed with status ${response.status}`);
      }
      const data = await response.json();
      setArticleHTML(data.html_content);
    } catch (err) {
      console.error("Error generating article:", err);
      setError("Couldn't generate the article: the local generator service may be offline.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(articleHTML);
      alert("Article copied to clipboard!");
    } catch (err) {
      console.error("Error copying article:", err);
      alert("Couldn't copy to clipboard.");
    }
  };

  return (
    <main className="sakura aw-page">
      <SectionHead as="h1" title="Generate an Article" />

      <form className="aw-form" onSubmit={handleGenerateArticle}>
        <Label htmlFor="aw-product">Product name</Label>
        <Input
          id="aw-product"
          face="sans"
          type="text"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="Enter product name"
        />
        <Button className="aw-submit" type="submit" disabled={loading}>
          Generate Article
        </Button>
      </form>

      {error && (
        <div className="aw-error" role="alert">
          <StatusPill status="error">Error</StatusPill>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="aw-loading" role="status" aria-busy="true">
          <MonoLabel>Generating article…</MonoLabel>
          <div className="aw-loading-lines">
            <Skeleton shape="text" style={{ width: "92%" }} />
            <Skeleton shape="text" style={{ width: "78%" }} />
            <Skeleton shape="text" style={{ width: "55%" }} />
          </div>
        </div>
      )}

      {articleHTML && !loading && (
        <Card className="aw-card">
          <CardHeader>
            <CardTitle as="h2">Generated Article</CardTitle>
            <MonoLabel tone="muted">HTML</MonoLabel>
          </CardHeader>
          <CardContent>
            {/* Arbitrary HTML from the local generator, injected exactly as
                before. Its typography is mapped to ratified roles in
                ArticleWriter.css — flagged in the lane coverage record
                because the library has no prose-headings component. */}
            <div className="aw-article" dangerouslySetInnerHTML={{ __html: articleHTML }} />
          </CardContent>
          <CardFooter>
            <Button variant="ghost" type="button" onClick={handleCopy}>
              Copy to Clipboard
            </Button>
          </CardFooter>
        </Card>
      )}
    </main>
  );
};
