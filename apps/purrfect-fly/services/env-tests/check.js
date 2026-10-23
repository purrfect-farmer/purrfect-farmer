/** Run a check and record its outcome, returns whether it passed */
export async function check(results, label, fn) {
  try {
    const message = await fn();
    results.push({ label, ok: true, message });
    return true;
  } catch (error) {
    results.push({
      label,
      ok: false,
      message:
        error.description ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message,
    });
    return false;
  }
}
