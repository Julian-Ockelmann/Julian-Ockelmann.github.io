# Gemfile — self-build with Jekyll 4 (works on GitHub Actions + locally)
source "https://rubygems.org"

ruby ">= 3.1"

gem "jekyll", "~> 4.3"
gem "webrick", "~> 1.8"        # needed for `jekyll serve` on Ruby 3+

group :jekyll_plugins do
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-include-cache", "~> 0.2"
  gem "jekyll-github-metadata", "~> 2.13"
  gem "kramdown-parser-gfm", "~> 1.1"
  gem "faraday-retry", "~> 2.2" # silences Faraday v2 retry warning
  # Uncomment only if you use it:
  # gem "jekyll-spaceship", "~> 0.2"
end
