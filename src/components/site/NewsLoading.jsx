import React from 'react';

function Lines({count = 2}) {
  return <div className="loading-lines">{Array.from({length: count}, (_, i) => <div className="loading-block loading-line" key={i}/>)}</div>;
}

function LoadingCard() {
  return <div className="news-card loading-card"><div className="loading-block loading-image"/><div className="card-copy"><Lines/><div className="loading-block loading-meta"/></div></div>;
}

function LoadingStory() {
  return <div className="loading-story"><div className="loading-block loading-thumb"/><Lines/></div>;
}

function LoadingLatest() {
  return <aside className="latest"><Lines count={1}/>{Array.from({length: 5}, (_, i) => <LoadingStory key={i}/>)}</aside>;
}

export function NewsLoading({variant = 'home'}) {
  const status = {role: 'status', 'aria-label': 'সংবাদ লোড হচ্ছে', 'aria-busy': true};

  if (variant === 'article') {
    return <main className="wrap article-page news-loading" {...status}><div aria-hidden="true"><div className="loading-block loading-meta"/><div className="article-layout"><aside className="article-meta"><Lines count={3}/></aside><article><div className="loading-block loading-image"/><div className="article-copy"><Lines/><div className="loading-body"><Lines count={6}/></div></div></article><LoadingLatest/></div></div></main>;
  }

  if (variant === 'listing') {
    return <main className="news-loading" {...status}><div aria-hidden="true"><div className="category-heading"><div className="loading-block loading-heading"/></div><div className="wrap listing-layout"><div className="card-grid">{Array.from({length: 6}, (_, i) => <LoadingCard key={i}/>)}</div><LoadingLatest/></div></div></main>;
  }

  return <main className="wrap home news-loading" {...status}><div className="home-top" aria-hidden="true"><div className="lead-col"><div className="lead"><Lines/><div className="loading-block loading-image"/><div className="loading-block loading-meta"/><Lines count={3}/></div><LoadingStory/><LoadingStory/></div><div className="center-grid-wrap"><div className="center-grid">{Array.from({length: 6}, (_, i) => <LoadingCard key={i}/>)}</div></div><div className="home-sidebar"><LoadingLatest/></div></div></main>;
}
