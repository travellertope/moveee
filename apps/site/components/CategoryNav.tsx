"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";

interface CategoryNavProps {
  categories: Array<{ name: string; slug: string }>;
  currentCategory: string | null;
  activeFilter: boolean;
}

export default function CategoryNav({ categories, currentCategory, activeFilter }: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Prevent drag from triggering clicks on links
  const handleLinkClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  return (
    <div
      ref={scrollRef}
      className={`mg-nav-tabs ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {categories.map((cat) => {
        const isActive = (currentCategory === cat.slug) || (!currentCategory && !activeFilter && !cat.slug);
        return (
          <Link
            key={cat.name}
            href={cat.slug ? `/magazine/category/${cat.slug}` : "/magazine"}
            style={{ textDecoration: 'none' }}
            onClick={handleLinkClick}
          >
            <button className={`mg-nav-tab${isActive ? ' mg-nav-tab--active' : ''}`}>
              {cat.name}
            </button>
          </Link>
        );
      })}
    </div>
  );
}
