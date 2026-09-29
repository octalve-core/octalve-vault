import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";

function ArrowUpRight() {
  return <span aria-hidden="true" className="text-[#0A84FF] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>;
}

function FooterLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  const className = "group inline-flex items-start gap-2 text-sm font-normal leading-7 text-[#C7D2E1] transition hover:text-white";
  if (external) {
    return <a href={href} target="_blank" rel="noreferrer" className={className}><ArrowUpRight /><span>{children}</span></a>;
  }
  return <Link href={href} className={className}><ArrowUpRight /><span>{children}</span></Link>;
}

function FooterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-[15px] font-medium tracking-[-0.02em] text-[#F8FAFC]">{title}</h3>
      <div className="mt-5 grid gap-3">{children}</div>
    </section>
  );
}

const socialLinks = [
  { label: "Facebook", short: "f", href: "https://web.facebook.com/octalve" },
  { label: "LinkedIn", short: "in", href: "https://ng.linkedin.com/company/octalve" },
  { label: "Instagram", short: "ig", href: "https://www.instagram.com/octalve_/" },
  { label: "X", short: "x", href: "https://x.com/octalve" },
] as const;

export function SiteFooter({ locale }: { locale: Locale }) {
  const messages = getMessages(locale);
  const homeHref = localeHref(locale, "/");

  return (
    <footer className="bg-[#020B1C] px-4 pb-8 pt-14 text-white sm:px-6 md:px-8 md:pt-20">
      <div className="mx-auto w-full max-w-[1360px]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8FA2BF]">Octalve Vault</p>
            <h2 className="mt-3 text-4xl font-medium leading-tight tracking-[-0.05em] text-[#F8FAFC] sm:text-5xl md:text-6xl">
              Octalve, <span className="text-[#0A84FF]">move value</span> with resources built for action.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3" aria-label="Octalve social links">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0064E0] text-xs uppercase transition hover:scale-105 hover:bg-[#0057C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 text-white font-medium"
              >
                {item.short}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2 xl:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_0.8fr]">
          <div>
            <Link href={homeHref} className="inline-flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50">
              <Image src="/brand/octalve-logo.png" alt="Octalve" width={170} height={52} className="h-auto w-[150px] object-contain sm:w-[170px]" />
            </Link>
            <p className="mt-6 max-w-md text-base font-normal leading-8 text-[#C7D2E1]">
              {translate(messages, "footer.tagline")} Vault is Octalve&apos;s digital-resources platform for practical business and growth assets.
            </p>
          </div>

          <FooterSection title="Vault">
            <FooterLink href={homeHref}>Vault</FooterLink>
            <FooterLink href={localeHref(locale, "/products")}>{translate(messages, "nav.shop")}</FooterLink>
            <FooterLink href={localeHref(locale, "/cart")}>{translate(messages, "nav.cart")}</FooterLink>
            <FooterLink href={localeHref(locale, "/checkout")}>{translate(messages, "nav.checkout")}</FooterLink>
            <FooterLink href={localeHref(locale, "/vault")}>{translate(messages, "nav.myVault")}</FooterLink>
          </FooterSection>

          <FooterSection title="Help & Support">
            <FooterLink href={localeHref(locale, "/contact")}>{translate(messages, "nav.contact")}</FooterLink>
            <FooterLink href={`${homeHref}#vault-faq`}>FAQ</FooterLink>
            <FooterLink href={localeHref(locale, "/vault")}>Download support</FooterLink>
          </FooterSection>

          <FooterSection title="Legal">
            <FooterLink href={localeHref(locale, "/privacy")}>{translate(messages, "footer.privacy")}</FooterLink>
            <FooterLink href={localeHref(locale, "/terms")}>{translate(messages, "footer.terms")}</FooterLink>
            <FooterLink href={localeHref(locale, "/refund-policy")}>{translate(messages, "footer.refund")}</FooterLink>
            <FooterLink href={localeHref(locale, "/digital-product-license")}>{translate(messages, "footer.license")}</FooterLink>
          </FooterSection>

          <FooterSection title="Octalve">
            <FooterLink href="https://octalve.com" external>Octalve.com</FooterLink>
            <FooterLink href="https://octalve.com/contact" external>Company contact</FooterLink>
          </FooterSection>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs font-normal text-[#8FA2BF] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Octalve. All rights reserved.</span>
          <span>Secure digital resources · Private fulfilment · Global access</span>
        </div>
      </div>
    </footer>
  );
}
