(() => {
  const page = document.body.dataset.blogPage;
  const dataPath = document.body.dataset.blogData || "../content/blog/posts.json";
  const toAbsoluteUrl = (path) => new URL(path, window.location.origin).toString();
  const setHeadMeta = (id, value) => {
    const node = document.getElementById(id);
    if (node && value) {
      node.setAttribute("content", value);
    }
  };
  const setCanonical = (path) => {
    const node = document.getElementById("canonical-url");
    if (node) {
      node.setAttribute("href", toAbsoluteUrl(path));
    }
  };
  const applySeo = ({ title, description, canonicalPath, imagePath, type = "website" }) => {
    if (title) {
      document.title = title;
      setHeadMeta("og-title", title);
      setHeadMeta("twitter-title", title);
    }
    if (description) {
      setHeadMeta("meta-description", description);
      setHeadMeta("og-description", description);
      setHeadMeta("twitter-description", description);
    }
    if (canonicalPath) {
      const canonical = toAbsoluteUrl(canonicalPath);
      setCanonical(canonicalPath);
      setHeadMeta("og-url", canonical);
    }
    if (imagePath) {
      const image = toAbsoluteUrl(imagePath);
      setHeadMeta("og-image", image);
      setHeadMeta("twitter-image", image);
    }
    setHeadMeta("og-type", type);
  };
  const allowedCategories = [
    "Guides for digital nomads",
    "Case studies",
    "Policy and legal analysis",
  ];

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const escapeHTML = (value) =>
    String(value || "").replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[char];
    });

  const stripMarkdown = (value) =>
    String(value || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]*`/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[>*_#~-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const formatDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const toDisplayPath = (value) => {
    if (!value) {
      return "";
    }
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
      return value;
    }
    return `../${value.replace(/^\.?\//, "")}`;
  };

  const normalizePost = (post, index) => {
    const title = post?.title?.trim() || `Untitled Post ${index + 1}`;
    const slug = slugify(post?.slug || title) || `post-${index + 1}`;
    const body = post?.body || "";
    const excerptSource = post?.excerpt || stripMarkdown(body);
    const excerpt = excerptSource.length > 190 ? `${excerptSource.slice(0, 187)}...` : excerptSource;
    const publishDate = post?.publishDate || post?.updatedDate || "";
    const category = allowedCategories.includes(post?.category)
      ? post.category
      : "Guides for digital nomads";

    return {
      title,
      slug,
      body,
      excerpt,
      category,
      published: post?.published !== false,
      publishDate,
      updatedDate: post?.updatedDate || "",
      coverImage: toDisplayPath(post?.coverImage || ""),
    };
  };

  const fetchPosts = async () => {
    const response = await fetch(dataPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load blog content (${response.status})`);
    }
    const payload = await response.json();
    const posts = Array.isArray(payload?.posts) ? payload.posts : [];
    return posts
      .map(normalizePost)
      .filter((post) => post.published)
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  };

  const renderMarkdown = (markdown) => {
    if (!window.marked) {
      return `<p>${escapeHTML(markdown)}</p>`;
    }

    const parsed = window.marked.parse(markdown);
    if (!window.DOMPurify) {
      return parsed;
    }
    return window.DOMPurify.sanitize(parsed);
  };

  const cleanHeadingText = (value) =>
    String(value || "")
      .replace(/^#{1,6}\s+/, "")
      .replace(/[*_`~]/g, "")
      .trim()
      .toLowerCase();

  const splitLongParagraph = (text) => {
    const sentenceChunks = String(text || "").match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (!sentenceChunks || sentenceChunks.length < 4) {
      return text;
    }

    const chunks = [];
    for (let i = 0; i < sentenceChunks.length; i += 2) {
      const block = sentenceChunks.slice(i, i + 2).join(" ").trim();
      if (block) {
        chunks.push(block);
      }
    }
    return chunks.join("\n\n");
  };

  const preparePostBody = (body, title) => {
    const source = String(body || "").replace(/\r\n?/g, "\n").trim();
    if (!source) {
      return "";
    }

    const lines = source.split("\n");
    const firstLine = lines[0]?.trim() || "";
    if (cleanHeadingText(firstLine) === cleanHeadingText(title)) {
      lines.shift();
      while (lines[0] && lines[0].trim() === "") {
        lines.shift();
      }
    }

    const normalized = lines.join("\n");
    const blocks = normalized
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        if (/^(#{1,6}\s|[-*]\s|>\s|\d+\.\s)/.test(block)) {
          return block;
        }
        if (block.length > 420) {
          return splitLongParagraph(block);
        }
        return block;
      });

    return blocks.join("\n\n");
  };

  const renderList = async () => {
    const listRoot = document.querySelector("#blog-list");
    const emptyState = document.querySelector("#blog-empty");
    if (!listRoot) {
      return;
    }

    try {
      applySeo({
        title: "K Abroad Blog | Migration Insights",
        description: "Practical migration insights, planning advice, and cross-border strategy notes from K Abroad.",
        canonicalPath: "/blog/index.html",
        imagePath: "/Images/remote2.jpg",
        type: "website",
      });

      const posts = await fetchPosts();
      if (posts.length === 0) {
        if (emptyState) {
          emptyState.hidden = false;
        }
        return;
      }

      const cards = posts
        .map((post) => {
          const publishDate = formatDate(post.publishDate);
          const dateText = publishDate ? `<p class="blog-meta">${publishDate}</p>` : "";
          const metaRow = `
            <div class="blog-meta-row">
              <span class="blog-category-tag">${escapeHTML(post.category)}</span>
              ${dateText}
            </div>
          `;
          const cover = post.coverImage
            ? `<a class="blog-card-image-link" href="./post.html?slug=${encodeURIComponent(post.slug)}"><div class="blog-card-media"><img src="${escapeHTML(post.coverImage)}" alt=""></div></a>`
            : "";

          return `
            <article class="blog-card">
              ${cover}
              <div class="blog-card-body">
                ${metaRow}
                <h3><a class="blog-card-title-link" href="./post.html?slug=${encodeURIComponent(post.slug)}">${escapeHTML(post.title)}</a></h3>
                <p>${escapeHTML(post.excerpt)}</p>
                <a class="blog-card-link" href="./post.html?slug=${encodeURIComponent(post.slug)}">Read article</a>
              </div>
            </article>
          `;
        })
        .join("");

      listRoot.innerHTML = cards;
    } catch (error) {
      listRoot.innerHTML = `<p class="blog-error">${escapeHTML(error.message)}</p>`;
    }
  };

  const renderPost = async () => {
    const titleNode = document.querySelector("#post-title");
    const metaNode = document.querySelector("#post-meta");
    const categoryNode = document.querySelector("#post-category");
    const bodyNode = document.querySelector("#post-body");
    const coverNode = document.querySelector("#post-cover");
    if (!titleNode || !metaNode || !categoryNode || !bodyNode || !coverNode) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = slugify(params.get("slug"));
    if (!slug) {
      titleNode.textContent = "Post not found";
      metaNode.textContent = "";
      bodyNode.innerHTML = "<p>Please return to the blog list and select a post.</p>";
      return;
    }

    try {
      const posts = await fetchPosts();
      const post = posts.find((item) => item.slug === slug);
      if (!post) {
        titleNode.textContent = "Post not found";
        metaNode.textContent = "";
        bodyNode.innerHTML = "<p>The requested article is unavailable.</p>";
        return;
      }

      titleNode.textContent = post.title;
      categoryNode.textContent = post.category;
      categoryNode.hidden = false;
      const publishLabel = formatDate(post.publishDate);
      const updatedLabel = formatDate(post.updatedDate);

      if (publishLabel && updatedLabel && publishLabel !== updatedLabel) {
        metaNode.textContent = `Published ${publishLabel} • Updated ${updatedLabel}`;
      } else if (publishLabel) {
        metaNode.textContent = `Published ${publishLabel}`;
      } else {
        metaNode.textContent = "";
      }

      if (post.coverImage) {
        coverNode.src = post.coverImage;
        coverNode.alt = post.title;
        coverNode.hidden = false;
      } else {
        coverNode.hidden = true;
      }

      bodyNode.innerHTML = renderMarkdown(preparePostBody(post.body, post.title));
      const postTitle = `${post.title} | K Abroad Blog`;
      applySeo({
        title: postTitle,
        description: post.excerpt || stripMarkdown(post.body).slice(0, 180),
        canonicalPath: `/blog/post.html?slug=${encodeURIComponent(post.slug)}`,
        imagePath: post.coverImage || "/Images/remote2.jpg",
        type: "article",
      });
    } catch (error) {
      titleNode.textContent = "Unable to load post";
      metaNode.textContent = "";
      bodyNode.innerHTML = `<p class="blog-error">${escapeHTML(error.message)}</p>`;
    }
  };

  if (page === "list") {
    renderList();
  } else if (page === "post") {
    renderPost();
  }
})();
