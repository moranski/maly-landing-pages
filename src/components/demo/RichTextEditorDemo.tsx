// Co-authored-by: Codex <codex@openai.com>
import { useState, type ComponentProps } from "react";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { PortableTextEditor } from "@emdash-cms/admin";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RichText } from "../../lib/landing/rich-text";

i18n.load("he", {});
i18n.activate("he");
type EditorValue = NonNullable<ComponentProps<typeof PortableTextEditor>["value"]>;
export default function RichTextEditorDemo({ body }: { body: RichText }) {
	const [value, setValue] = useState<EditorValue>(body);
	const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } }));
	return <QueryClientProvider client={queryClient}><I18nProvider i18n={i18n}>
		<p>עורך EmDash להמחשה מקומית. השינויים נשארים בדפדפן ואינם נשמרים באתר.</p>
		<PortableTextEditor value={value} onChange={setValue} placeholder="אפשר לנסות הדגשה ורשימות" />
		<details><summary>מבנה הטקסט שנוצר בעורך</summary><pre dir="ltr" data-editor-value>{JSON.stringify(value, null, 2)}</pre></details>
	</I18nProvider></QueryClientProvider>;
}
