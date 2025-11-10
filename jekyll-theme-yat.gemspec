# Gemfile — self-build with Jekyll 4
source "https://rubygems.org"
ruby "3.3"

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
  # Enable only if you actually use it:
  # gem "jekyll-spaceship", "~> 0.2"
end
