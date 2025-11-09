import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-teal"
              >
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
                <path
                  d="M16 8v8l4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="16" cy="16" r="2" fill="currentColor"/>
              </svg>
              <span className="text-xl font-semibold text-charcoal">Nudget</span>
            </div>
            <p className="text-gray text-sm">
              Your Money, Nudged in the Right Direction.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-charcoal mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-gray hover:text-teal transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray hover:text-teal transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-gray hover:text-teal transition-colors">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-charcoal mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-gray hover:text-teal transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-gray hover:text-teal transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#blog" className="text-gray hover:text-teal transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-charcoal mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#privacy" className="text-gray hover:text-teal transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#terms" className="text-gray hover:text-teal transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray">
            © 2024 Nudget. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}