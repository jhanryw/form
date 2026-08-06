import Script from "next/script";

interface MetaPixelScriptProps {
  pixelId: string;
}

/**
 * Injeta o stub oficial do Meta Pixel com strategy="beforeInteractive" —
 * roda antes da hidratação, garantindo que window.fbq já exista quando os
 * hooks de tracking chamarem trackPageView/trackCustomEvent. Sem isso, um
 * disparo muito cedo (antes do script carregar) perderia o evento em
 * silêncio, já que fbq ainda não existiria.
 *
 * Renderizado uma única vez no layout raiz; o "id" faz o Next.js deduplicar
 * a injeção caso o componente seja re-renderizado.
 */
export function MetaPixelScript({ pixelId }: MetaPixelScriptProps) {
  return (
    // A regra do eslint-plugin-next para "beforeInteractive" ainda cobre só o
    // Pages Router (pages/_document.js). No App Router, o próprio guia oficial
    // do Next.js documenta este mesmo padrão dentro de app/layout.tsx (onde
    // este componente é usado) — é um falso positivo conhecido da regra.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="meta-pixel-base" strategy="beforeInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(pixelId)});`}
    </Script>
  );
}
