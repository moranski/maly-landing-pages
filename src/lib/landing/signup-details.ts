// Co-authored-by: Codex <codex@openai.com>
export interface SignupDetails {
	name: string;
	phone: string;
	email: string;
}

export function normalizeIsraeliPhone(value: string): string | undefined {
	const trimmed = value.trim();
	if (trimmed.length > 24 || !/^\+?[\d\s().-]+$/u.test(trimmed)) return undefined;
	const compact = trimmed.replace(/[\s().-]/gu, "");
	const phone = compact.startsWith("+972") ? `0${compact.slice(4)}` : compact;
	return /^0(?:5\d{8}|[23489]\d{7}|7\d{8})$/u.test(phone) ? phone : undefined;
}

export function normalizeSignupDetails(details: SignupDetails): SignupDetails | undefined {
	const name = details.name.trim().replace(/\s+/gu, " ");
	const email = details.email.trim();
	const phone = normalizeIsraeliPhone(details.phone);
	if (!name || name.length > 120 || /[\u0000-\u001f\u007f]/u.test(name)) return undefined;
	if (!email || email.length > 254 || /[\u0000-\u0020\u007f]/u.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return undefined;
	if (!phone) return undefined;
	return { name, phone, email };
}
