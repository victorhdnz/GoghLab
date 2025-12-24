import { redirect } from 'next/navigation';

// Se alguém acessar /links sem slug, redirecionar para a homepage
export default function LinksPage() {
  redirect('/');
}

