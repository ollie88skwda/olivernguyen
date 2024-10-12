import React, { useState } from "react";
import { Helmet } from "react-helmet";
import "../Home.css";

export const ArticleWriter = () => {
  const [product, setProduct] = useState("");
  const [articleHTML, setArticleHTML] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/generate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product }),
      });

      const data = await response.json();
      setArticleHTML(data.html_content);
    } catch (error) {
      console.error("Error generating article:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Helmet>
        <title>Generate Article</title>
      </Helmet>
      <h1>Generate an Article</h1>

      <input
        type="text"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        placeholder="Enter product name"
      />

      <button onClick={handleGenerateArticle}>Generate Article</button>

      {loading && <p>Generating article...</p>}

      {articleHTML && (
        <div>
          <h2>Generated Article:</h2>
          <div dangerouslySetInnerHTML={{ __html: articleHTML }} />
          <button
            onClick={() => {
              navigator.clipboard.writeText(articleHTML);
              alert("Article copied to clipboard!");
            }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
};
