/* eslint-disable react/no-danger */
import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const subtotal = post.data.content.map(item => {
    const totalHeading = item.heading.split(' ').length + 1;
    const totalBody = item.body.reduce((acc, current) => {
      const count = current.text ? current.text.split(' ').length : 0;
      return acc + count;
    }, 0);
    return totalHeading + totalBody;
  });

  const total = subtotal.reduce((acc, current) => {
    return acc + current;
  }, 0);

  const readTime = Math.ceil(total / 200);

  const router = useRouter();

  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  const formattedDate = (data: string): string => {
    return format(parseISO(data), 'dd MMM yyyy', {
      locale: ptBR,
    });
  };

  return (
    <>
      <Head>
        <title>Home | SpaceTravelling</title>
      </Head>
      <Header type="small" />
      <main>
        <article key={String('index')}>
          <img
            className={styles.banner}
            src={post.data.banner.url}
            alt="titulo do post"
          />

          <div className={styles.postContentArticle}>
            <header>
              <h2>{post.data.title}</h2>
              <div>
                <div>
                  <FiCalendar color="#D7D7D7" />
                  <time>{formattedDate(post.first_publication_date)}</time>
                </div>
                <div>
                  <FiUser color="#D7D7D7" />
                  <span>{post.data.author}</span>
                </div>
                <div>
                  <FiClock color="#D7D7D7" />
                  <span>{`${readTime} min`}</span>
                </div>
              </div>
            </header>
            {post.data.content.map(content => {
              return (
                <div key={content.heading} className={styles.postBody}>
                  <h3>{content.heading}</h3>
                  <div
                    className={styles.postContent}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('post', String(slug), {});
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
          // body: RichText.asHtml(content.body),
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
