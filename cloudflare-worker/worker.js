/**
 * GitHub OAuth proxy for the custom admin at /admin.
 * Deploy this on Cloudflare Workers (free tier). See ../CMS_SETUP.md for
 * step-by-step deployment instructions.
 *
 * Required Worker environment variables (set as "Secrets" in the dashboard):
 *   GITHUB_CLIENT_ID     - Client ID from your GitHub OAuth App
 *   GITHUB_CLIENT_SECRET - Client Secret from your GitHub OAuth App
 *
 * Flow: the admin page redirects the whole browser tab here (no popup —
 * popups get silently blocked in a lot of embedded/mobile browsers), we
 * bounce to GitHub, GitHub calls us back with a code, we exchange it for a
 * token and redirect the browser straight back to the admin page with the
 * token in the URL hash fragment.
 */

// Only ever redirect back to a known admin origin — prevents this Worker
// from being abused as an open redirect / token-leak relay.
const ALLOWED_REDIRECT_ORIGINS = [
  "https://bbbkai0314-netizen.github.io",
  "https://snowsurfstudio.net",
  "https://www.snowsurfstudio.net",
];

function isAllowedRedirect(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (ALLOWED_REDIRECT_ORIGINS.includes(u.origin)) return true;
    // allow local development origins too
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    return false;
  } catch (e) {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const redirectTo = url.searchParams.get("redirect_to") || "";
      const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
      authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
      authorizeUrl.searchParams.set("scope", "repo,user");
      if (redirectTo && isAllowedRedirect(redirectTo)) {
        authorizeUrl.searchParams.set("state", redirectTo);
      }
      return Response.redirect(authorizeUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code) {
        return new Response("Missing code", { status: 400 });
      }

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`, {
          status: 401,
        });
      }

      if (state && isAllowedRedirect(state)) {
        const dest = new URL(state);
        dest.hash = "token=" + encodeURIComponent(tokenData.access_token);
        return Response.redirect(dest.toString(), 302);
      }

      return new Response("Missing or invalid redirect target", { status: 400 });
    }

    return new Response("Not found", { status: 404 });
  },
};
