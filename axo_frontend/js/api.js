const API = {
  async get(url) {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    return res.json();
  }
};

