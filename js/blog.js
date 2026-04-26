(() => {
  const page = document.body.dataset.blogPage;
  const dataPath = document.body.dataset.blogData || "../content/blog/posts.json";
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

  const renderList = async () => {
    const listRoot = document.querySelector("#blog-list");
    const emptyState = document.querySelector("#blog-empty");
    if (!listRoot) {
      return;
    }

    try {
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
            ? `<div class="blog-card-media"><img src="${escapeHTML(post.coverImage)}" alt=""></div>`
            : "";

          return `
            <article class="blog-card">
              ${cover}
              <div class="blog-card-body">
                ${metaRow}
                <h3>${escapeHTML(post.title)}</h3>
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

      bodyNode.innerHTML = renderMarkdown(post.body);
      document.title = `${post.title} | K Abroad Blog`;
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
