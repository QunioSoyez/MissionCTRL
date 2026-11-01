/**
 * Mission CTRL - Main JavaScript
 * Clean, modern, accessible interactions
 */

(function() {
  'use strict';

  // ===== Utility Functions =====
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ===== Header Scroll Effect =====
  function initHeaderScroll() {
    const header = $('.header');
    if (!header) return;

    const handleScroll = debounce(() => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, 10);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ===== Mobile Navigation =====
  function initMobileNav() {
    const navToggle = $('.nav-toggle');
    const nav = $('.nav');
    
    if (!navToggle || !nav) return;

    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      nav.classList.toggle('is-open');
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = isExpanded ? '' : 'hidden';
    });

    // Close menu when clicking a link
    $$('.nav-link', nav).forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        document.body.style.overflow = '';
        navToggle.focus();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && 
          !nav.contains(e.target) && 
          !navToggle.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  }

  // ===== Smooth Scroll for Anchor Links =====
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = $(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight = $('.header')?.offsetHeight || 72;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Focus target for accessibility
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      });
    });
  }

  // ===== Active Navigation Link =====
  function initActiveNav() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    $$('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // ===== Form Handling =====
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const successMessage = form.querySelector('.form-message.success');
    const errorMessage = form.querySelector('.form-message.error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Hide previous messages
      if (successMessage) successMessage.style.display = 'none';
      if (errorMessage) errorMessage.style.display = 'none';

      // Validate form
      if (!validateForm(form)) {
        if (errorMessage) {
          errorMessage.textContent = 'Please fill in all required fields correctly.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      // Disable submit button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      // Collect form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        // Simulate form submission (replace with actual endpoint)
        await submitForm(data);
        
        // Show success
        if (successMessage) {
          successMessage.textContent = 'Thank you for your message! We\'ll get back to you soon.';
          successMessage.style.display = 'block';
        }
        form.reset();
      } catch (error) {
        console.error('Form submission error:', error);
        if (errorMessage) {
          errorMessage.textContent = 'Something went wrong. Please try again or email us directly.';
          errorMessage.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });

    // Real-time validation
    $$('input, textarea, select', form).forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) {
          validateField(field);
        }
      });
    });
  }

  function validateForm(form) {
    let isValid = true;
    $$('input[required], textarea[required], select[required]', form).forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  }

  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Remove existing error styling
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();

    // Required check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required.';
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address.';
      }
    }

    // Phone validation (optional)
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number.';
      }
    }

    if (!isValid) {
      field.classList.add('error');
      const error = document.createElement('span');
      error.className = 'field-error';
      error.style.cssText = 'color: var(--color-danger); font-size: var(--font-size-sm); margin-top: var(--space-xs); display: block;';
      error.textContent = errorMessage;
      field.parentNode.appendChild(error);
    }

    return isValid;
  }

  async function submitForm(data) {
    // Simulate API call - replace with actual endpoint
    // For now, we'll just simulate a successful submission
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Form submitted:', data);
        resolve({ success: true });
      }, 1000);
    });

    /* 
    // Actual implementation would be:
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Submission failed');
    }
    
    return response.json();
    */
  }

  // ===== Intersection Observer for Animations =====
  function initScrollAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Show all animated elements immediately
      $$('.animate-fade-in-up, .animate-fade-in').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe animated elements
    $$('.animate-fade-in-up, .animate-fade-in').forEach(el => {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
  }

  // ===== Lazy Loading Images =====
  function initLazyLoading() {
    if (!('loading' in HTMLImageElement.prototype)) {
      // Fallback for browsers without native lazy loading
      const lazyImages = $$('img[loading="lazy"]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            img.removeAttribute('loading');
            imageObserver.unobserve(img);
          }
        });
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }

  // ===== Back to Top Button =====
  function initBackToTop() {
    // Create back to top button
    const backToTop = document.createElement('button');
    backToTop.className = 'back-to-top';
    backToTop.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    backToTop.setAttribute('aria-label', 'Back to top');
    backToTop.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-primary);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius-full);
      cursor: pointer;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
      transition: all var(--transition-base);
      z-index: var(--z-fixed);
    `;

    document.body.appendChild(backToTop);

    // Show/hide based on scroll
    const toggleBackToTop = debounce(() => {
      if (window.scrollY > 300) {
        backToTop.style.opacity = '1';
        backToTop.style.visibility = 'visible';
        backToTop.style.transform = 'translateY(0)';
      } else {
        backToTop.style.opacity = '0';
        backToTop.style.visibility = 'hidden';
        backToTop.style.transform = 'translateY(20px)';
      }
    }, 100);

    window.addEventListener('scroll', toggleBackToTop, { passive: true });

    // Scroll to top on click
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Hover effect
    backToTop.addEventListener('mouseenter', () => {
      backToTop.style.backgroundColor = 'var(--color-primary-dark)';
      backToTop.style.transform = 'translateY(-4px)';
    });

    backToTop.addEventListener('mouseleave', () => {
      backToTop.style.backgroundColor = 'var(--color-primary)';
      backToTop.style.transform = 'translateY(0)';
    });
  }

  // ===== Service Card Interactions =====
  function initServiceCards() {
    $$('.service-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ===== Initialize All =====
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initHeaderScroll();
    initMobileNav();
    initSmoothScroll();
    initActiveNav();
    initContactForm();
    initScrollAnimations();
    initLazyLoading();
    initBackToTop();
    initServiceCards();

    // Add loaded class to body for any CSS transitions
    document.body.classList.add('js-loaded');
  }

  // Start initialization
  init();

})();