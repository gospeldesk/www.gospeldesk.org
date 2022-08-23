run:
	jekyll serve --host 0.0.0.0 --livereload --drafts

dead:
	killall make
	killall -9 docker
