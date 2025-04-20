dist/bmg.cjs: src/**/*
	pnpm run build

livescript/bmg-ls.cjs: dist/bmg.cjs livescript/bmg-ls.ls
	lsc -c --output livescript --bare livescript/bmg-ls.ls
	mv livescript/bmg-ls.js livescript/bmg-ls.cjs

livescript/test.cjs: dist/bmg.cjs livescript/bmg-ls.cjs livescript/*.ls
	lsc -c --output livescript --bare livescript/test.ls
	mv livescript/test.js livescript/test.cjs
