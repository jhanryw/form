import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormBySlug } from "@/forms";
import { FormRunner } from "@/components/form/FormRunner";

export async function generateMetadata(
  props: PageProps<"/[formSlug]">,
): Promise<Metadata> {
  const { formSlug } = await props.params;
  const form = getFormBySlug(formSlug);

  if (!form) {
    return {};
  }

  return {
    title: `${form.niche} | Qarvon`,
  };
}

export default async function FormPage(props: PageProps<"/[formSlug]">) {
  const { formSlug } = await props.params;
  const form = getFormBySlug(formSlug);

  if (!form) {
    notFound();
  }

  return <FormRunner form={form} />;
}
