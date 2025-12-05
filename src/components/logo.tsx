export function Logo({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			height="2400"
			viewBox="0 0 24 24"
			width="2400"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g filter="url(#filter0_n_62_267)">
				<mask
					height="21"
					id="mask0_62_267"
					maskUnits="userSpaceOnUse"
					style={{ maskType: 'alpha' }}
					width="22"
					x="1"
					y="1"
				>
					<path
						d="M5.55811 14.2129C6.32684 13.3 7.71869 13.2588 8.53955 14.125L10.561 16.2588H10.562L16.0005 22H3.29932C1.59887 22 0.673865 20.0127 1.76904 18.7119L5.55811 14.2129ZM14.1987 10.4014C15.0048 9.10296 16.9114 9.15131 17.6499 10.4893L22.3638 19.0332C23.0992 20.3661 22.135 21.9997 20.6128 22H18.0669L17.0894 20.9688L11.3804 14.9414L14.1987 10.4014ZM7.99951 1C8.2995 1 8.55979 1.20757 8.62646 1.5L8.98291 3.06445C9.1474 3.78781 9.71175 4.35296 10.4351 4.51758L11.9995 4.87305C12.2921 4.93958 12.4995 5.19988 12.4995 5.5C12.4995 5.80012 12.2921 6.06042 11.9995 6.12695L10.4351 6.48242C9.71175 6.64704 9.1474 7.21219 8.98291 7.93555L8.62646 9.5C8.55979 9.79243 8.2995 10 7.99951 10C7.69973 9.99978 7.44017 9.79227 7.37354 9.5L7.01709 7.93555C6.8526 7.21219 6.28825 6.64704 5.56494 6.48242L4.00049 6.12695C3.70786 6.06042 3.49951 5.80012 3.49951 5.5C3.49951 5.19988 3.70786 4.93958 4.00049 4.87305L5.56494 4.51758C6.28825 4.35296 6.8526 3.78781 7.01709 3.06445L7.37354 1.5C7.44017 1.20773 7.69973 1.00022 7.99951 1Z"
						fill="#5A5DED"
					/>
				</mask>
				<g mask="url(#mask0_62_267)">
					<g filter="url(#filter1_f_62_267)">
						<circle cx="17" cy="5" fill="#A8AAFF" r="12" />
					</g>
					<g filter="url(#filter2_f_62_267)">
						<circle cx="5" cy="17" fill="#5A5DED" r="12" />
					</g>
					<g filter="url(#filter3_f_62_267)">
						<circle cx="22" cy="22" fill="#EBD6B2" r="8" />
					</g>
				</g>
			</g>
			<defs>
				<filter
					color-interpolation-filters="sRGB"
					filterUnits="userSpaceOnUse"
					height="24"
					id="filter0_n_62_267"
					width="24"
					x="0"
					y="0"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
					<feTurbulence
						baseFrequency="3.3333332538604736 3.3333332538604736"
						numOctaves="3"
						result="noise"
						seed="9433"
						stitchTiles="stitch"
						type="fractalNoise"
					/>
					<feComponentTransfer in="noise" result="coloredNoise1">
						<feFuncR intercept="-0.5" slope="2" type="linear" />
						<feFuncG intercept="-0.5" slope="2" type="linear" />
						<feFuncB intercept="-0.5" slope="2" type="linear" />
						<feFuncA
							tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
							type="discrete"
						/>
					</feComponentTransfer>
					<feComposite in="coloredNoise1" in2="shape" operator="in" result="noise1Clipped" />
					<feComponentTransfer in="noise1Clipped" result="color1">
						<feFuncA tableValues="0 0.1" type="table" />
					</feComponentTransfer>
					<feMerge result="effect1_noise_62_267">
						<feMergeNode in="shape" />
						<feMergeNode in="color1" />
					</feMerge>
				</filter>
				<filter
					color-interpolation-filters="sRGB"
					filterUnits="userSpaceOnUse"
					height="36"
					id="filter1_f_62_267"
					width="36"
					x="-1"
					y="-13"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
					<feGaussianBlur result="effect1_foregroundBlur_62_267" stdDeviation="3" />
				</filter>
				<filter
					color-interpolation-filters="sRGB"
					filterUnits="userSpaceOnUse"
					height="36"
					id="filter2_f_62_267"
					width="36"
					x="-13"
					y="-1"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
					<feGaussianBlur result="effect1_foregroundBlur_62_267" stdDeviation="3" />
				</filter>
				<filter
					color-interpolation-filters="sRGB"
					filterUnits="userSpaceOnUse"
					height="28"
					id="filter3_f_62_267"
					width="28"
					x="8"
					y="8"
				>
					<feFlood flood-opacity="0" result="BackgroundImageFix" />
					<feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
					<feGaussianBlur result="effect1_foregroundBlur_62_267" stdDeviation="3" />
				</filter>
			</defs>
		</svg>
	)
}
